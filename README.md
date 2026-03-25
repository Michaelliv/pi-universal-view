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

## AI features (audio transcription & image description)

The extension uses [markit's provider system](https://github.com/Michaelliv/markit) for AI-powered features — audio transcription via `gpt-4o-mini-transcribe` and image description via `gpt-4.1-nano`.

### Setup

Set your OpenAI API key via any of these (checked in order):

1. **Environment variable** — `export OPENAI_API_KEY=sk-...` (recommended)
2. **pi auth storage** — the extension bridges keys from pi's auth system into the environment automatically

No key? No problem — audio files still return metadata (duration, format, bitrate) and images pass through to pi's native vision. Transcription and description are additive.

### Supported providers

Markit supports both OpenAI and Anthropic as providers. By default it uses OpenAI. To configure a different provider or model, use markit's config system:

```bash
markit init                          # create .markit/ config
markit config set llm.provider anthropic
markit config set llm.apiKey sk-...
```

See [markit docs](https://github.com/Michaelliv/markit) for full provider configuration.

## Project structure

```
pi-universal-view/
├── .pi/extensions/universal-view/
│   └── index.ts          # Extension: intercepts read, routes to markit
└── package.json          # pi-package manifest
```

## How it's built

The extension registers a `read` tool that shadows pi's built-in:

1. **On session start** — resolve OpenAI key from pi's auth into the environment, then call `createLlmFunctions()` from markit to set up transcription and image description
2. **On each read** — check the file extension. Binary format? Route to `markit.convertFile()`. Everything else? Delegate to pi's built-in reader

~70 lines of code. The heavy lifting is in [markit](https://github.com/Michaelliv/markit).

## Credits

- [pi](https://github.com/badlogic/pi-mono) — the extensible coding agent
- [markit](https://github.com/Michaelliv/markit) — the universal file-to-markdown converter

## License

MIT
