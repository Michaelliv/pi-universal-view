import { extname, resolve } from "node:path";
import { accessSync, constants } from "node:fs";
import {
  type ExtensionAPI,
  createReadTool,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Markit } from "markit-ai";

const MARKIT_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".epub",
  ".ipynb",
  ".csv",
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".m4a",
  ".aac",
  ".wma",
  ".zip",
  ".rss",
  ".atom",
]);

function isMarkitFile(path: string): boolean {
  const ext = extname(path).toLowerCase();
  return MARKIT_EXTENSIONS.has(ext);
}

const readSchema = Type.Object({
  path: Type.String({
    description: "Path to the file to read (relative or absolute)",
  }),
  offset: Type.Optional(
    Type.Number({
      description: "Line number to start reading from (1-indexed)",
    }),
  ),
  limit: Type.Optional(
    Type.Number({ description: "Maximum number of lines to read" }),
  ),
});

async function buildTranscribe(
  getApiKey: () => Promise<string | undefined>,
): Promise<((audio: Buffer, mimetype: string) => Promise<string>) | undefined> {
  const apiKey = await getApiKey();
  if (!apiKey) return undefined;

  return async (audio: Buffer, mimetype: string): Promise<string> => {
    // Re-resolve key each call in case OAuth token refreshed
    const key = await getApiKey();
    if (!key) throw new Error("OpenAI API key no longer available");

    const ext = mimetype.split("/")[1] || "mp3";
    const form = new FormData();
    form.append("file", new Blob([audio], { type: mimetype }), `audio.${ext}`);
    form.append("model", "gpt-4o-mini-transcribe");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Transcription failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { text: string };
    return data.text;
  };
}

export default function (pi: ExtensionAPI) {
  let markit: Markit;
  let builtinRead: ReturnType<typeof createReadTool>;

  pi.on("session_start", async (_event, ctx) => {
    builtinRead = createReadTool(ctx.cwd);

    const getApiKey = () =>
      ctx.modelRegistry.authStorage.getApiKey("openai");
    const transcribe = await buildTranscribe(getApiKey);

    markit = new Markit(transcribe ? { transcribe } : {});

    if (ctx.hasUI) {
      ctx.ui.setStatus(
        "universal-view",
        ctx.ui.theme.fg("dim", "universal-view"),
      );
    }
  });

  pi.registerTool({
    name: "read",
    label: "Read",
    description:
      "Read the contents of a file. Supports text files and images (jpg, png, gif, webp). Also converts binary formats (PDF, DOCX, PPTX, XLSX, EPUB, Jupyter, CSV, audio, ZIP, RSS/Atom feeds) to markdown. For text files, output is truncated to 2000 lines or 50KB. Use offset/limit for large files.",
    parameters: readSchema,

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const absolutePath = resolve(ctx.cwd, params.path);

      if (isMarkitFile(absolutePath)) {
        try {
          accessSync(absolutePath, constants.R_OK);
        } catch {
          throw new Error(`File not found or not readable: ${params.path}`);
        }

        const result = await markit.convertFile(absolutePath);
        return {
          content: [{ type: "text", text: result.markdown }],
          details: {},
        };
      }

      return builtinRead.execute(toolCallId, params, signal, onUpdate, ctx);
    },
  });
}
