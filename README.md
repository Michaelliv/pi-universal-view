# pi-universal-view

Universal file reading for [pi](https://github.com/badlogic/pi-mono). Powered by [markit](https://github.com/Michaelliv/markit).

Drop any file into a conversation — PDF, DOCX, XLSX, EPUB, PowerPoint, Jupyter notebook, audio, ZIP — and pi reads it as markdown. No setup, no config. It just works.

## Install

```bash
pi install npm:pi-universal-view
```

## How it works

The extension **replaces pi's built-in `read` tool** with one that intercepts binary formats before they hit the default reader. Text files pass through unchanged. Binary files get converted to markdown via [markit-ai](https://www.npmjs.com/package/markit-ai).

```
read("paper.pdf")    → markit converts to markdown → LLM sees full text
read("data.xlsx")    → markit converts to markdown tables → LLM sees rows
read("index.ts")     → passes through to built-in read → unchanged
```

One tool, zero friction. The LLM doesn't know or care that the file was binary — it just sees markdown.

## Supported formats

| Category | Extensions |
|----------|-----------|
| Documents | `.pdf` `.docx` `.pptx` `.xlsx` `.epub` |
| Data | `.csv` `.ipynb` |
| Audio | `.mp3` `.wav` `.ogg` `.flac` `.m4a` `.aac` `.wma` (transcription via OpenAI) |
| Archives | `.zip` |
| Feeds | `.rss` `.atom` |

Everything else falls through to pi's default `read` — plain text, source code, config files, etc.

## Usage

Just use `read` as normal. The extension handles routing automatically:

- **"Read this PDF and summarize it"** → full document as markdown
- **"What's in this spreadsheet?"** → tables with headers and rows
- **"Transcribe this audio file"** → audio converted to text

No new tools to learn. No special syntax. The LLM's existing `read` tool gains superpowers.

## Audio transcription

Audio files are transcribed using OpenAI's `gpt-4o-mini-transcribe` model. The extension resolves the API key automatically via pi's auth system:

1. **OAuth** — if you're logged in via `pi login openai`, it just works
2. **API key in auth.json** — set via `pi` settings
3. **Environment variable** — `OPENAI_API_KEY`

If no OpenAI key is available, audio files still convert — you'll get metadata (duration, format) but no transcript.

## Project structure

```
pi-universal-view/
├── .pi/extensions/universal-view/
│   └── index.ts          # Extension: intercepts read, routes to markit
└── package.json          # pi-package manifest
```

## How it's built

The extension registers a `read` tool that shadows pi's built-in:

1. **Check the file extension** — is it in the markit set?
2. **Yes** → call `markit.convertFile()`, return markdown
3. **No** → delegate to `createReadTool()`, the original built-in reader

That's it. ~80 lines of code. The heavy lifting is in [markit](https://github.com/Michaelliv/markit).

## Credits

- [pi](https://github.com/badlogic/pi-mono) — the extensible coding agent
- [markit](https://github.com/Michaelliv/markit) — the universal file-to-markdown converter

## License

MIT
