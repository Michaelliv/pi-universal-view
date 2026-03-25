# pi-universal-view

Universal file reading for [pi](https://github.com/badlogic/pi-mono). Powered by [markit](https://github.com/Michaelliv/markit).

Read PDFs, DOCX, XLSX, EPUB, PowerPoint, Jupyter notebooks, audio files, and ZIPs directly in pi. The extension converts them to markdown so the LLM can work with them.

## Install

```bash
pi install npm:pi-universal-view
```

## How it works

The extension replaces pi's built-in `read` tool. Binary formats get converted to markdown via [markit-ai](https://www.npmjs.com/package/markit-ai). Everything else passes through to the default reader.

```
read("paper.pdf")    → markit converts to markdown → LLM sees full text
read("data.xlsx")    → markit converts to markdown tables → LLM sees rows
read("index.ts")     → passes through to built-in read → unchanged
```

## Supported formats

| Category | Extensions |
|----------|-----------|
| Documents | `.pdf` `.docx` `.pptx` `.xlsx` `.epub` |
| Data | `.csv` `.ipynb` |
| Audio | `.mp3` `.wav` `.ogg` `.flac` `.m4a` `.aac` `.wma` |
| Archives | `.zip` |
| Feeds | `.rss` `.atom` |

Text files, source code, images, and config files fall through to pi's default `read`.

## Audio transcription

Audio files include metadata (duration, format, bitrate) by default. With an OpenAI API key, they also get transcribed via `gpt-4o-mini-transcribe`.

Set your key:

1. **Environment variable** - `export OPENAI_API_KEY=sk-...`
2. **pi auth storage** - the extension bridges keys from pi's auth system into the environment automatically

Without a key, you still get metadata.

Markit supports both OpenAI and Anthropic. To configure a different provider or model:

```bash
markit init
markit config set llm.provider anthropic
markit config set llm.apiKey sk-...
```

See [markit docs](https://github.com/Michaelliv/markit) for details.

## How it's built

The extension registers a `read` tool that shadows pi's built-in:

1. On session start - resolve the OpenAI key from pi's auth into the environment, then call `createLlmFunctions()` from markit
2. On each read - check the file extension. Binary format? `markit.convertFile()`. Otherwise, delegate to pi's built-in reader

~70 lines of code. See [markit](https://github.com/Michaelliv/markit) for the conversion logic.

## Credits

- [pi](https://github.com/badlogic/pi-mono) by [@badlogic](https://github.com/badlogic)
- [markit](https://github.com/Michaelliv/markit)

## License

MIT
