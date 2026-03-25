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

function buildTranscribe(
  getApiKey: () => Promise<string | undefined>,
): (audio: Buffer, mimetype: string) => Promise<string> {
  return async (audio: Buffer, mimetype: string): Promise<string> => {
    const key = await getApiKey();

    if (!key) throw new Error("No OpenAI API key available for transcription");

    const extMap: Record<string, string> = {
      "audio/mpeg": "mp3", "audio/wav": "wav", "audio/mp4": "m4a",
      "audio/ogg": "ogg", "audio/flac": "flac", "audio/aac": "aac",
      "audio/x-ms-wma": "wma",
    };
    const ext = extMap[mimetype] || "mp3";
    const file = new File([new Uint8Array(audio)], `audio.${ext}`, { type: mimetype });
    const form = new FormData();
    form.append("file", file);
    form.append("model", "gpt-4o-mini-transcribe");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Transcription failed: ${res.status} ${res.statusText} ${body}`,
      );
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

    const getApiKey = async () => {
      // 1. Explicit env var (standard OpenAI API key — best for transcription)
      if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
      // 2. pi auth storage (API key or OAuth)
      for (const id of ["openai", "openai-codex"]) {
        try {
          const key = await ctx.modelRegistry.authStorage.getApiKey(id);
          if (key) return key;
        } catch {
          // skip
        }
      }
      return undefined;
    };
    const transcribe = buildTranscribe(getApiKey);

    markit = new Markit({ transcribe });

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
