1/ doubly introducing markit and pi-universal-view (the all-seeing pi 👁️)

markit converts any file to markdown. pdf, docx, xlsx, epub, audio, zip, urls, whatever.

pi-universal-view plugs it into @badlogicgames pi so your agent can read anything.

github.com/Michaelliv/markit
github.com/Michaelliv/pi-universal-view

📎 01-intro.png

---

2/ markit is a cli and an sdk. pdf becomes text, xlsx becomes tables, mp3 becomes a transcript.

npm install -g markit-ai

📎 02-cli.png

---

3/ audio files get metadata by default - duration, format, bitrate, id3 tags. set an openai key and you also get transcription via gpt-4o-mini-transcribe.

without a key you still get metadata.

📎 03-audio.png

---

4/ the sdk is one class. convertFile, convertUrl, or convert with a raw buffer.

📎 04-sdk.png

---

5/ pi-universal-view is the @badlogicgames pi extension. replaces the built-in read tool.

when your agent calls read() on a pdf or xlsx or mp3, markit handles it. text files and images pass through to the default reader like before.

pi install npm:pi-universal-view

📎 05-pi.png

---

6/ markit has a plugin system. write a function, register a converter, done. plugins run before builtins so you can override any format.

markit plugin install npm:markit-plugin-dwg
markit plugin install git:github.com/user/markit-plugin-ocr
markit plugin install ./my-plugin.ts

📎 06-plugin.png

---

7/ ~70 lines of extension code. markit does the rest.

supports pdf, docx, pptx, xlsx, epub, ipynb, csv, mp3, wav, flac, ogg, m4a, zip, rss, atom, urls, wikipedia. plugins can add more.

markit: github.com/Michaelliv/markit 🖍️
pi-universal-view: github.com/Michaelliv/pi-universal-view 👁️

📎 07-formats.png
