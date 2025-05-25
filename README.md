# Flashy Nerdy 🤓

A weekend project built for studying with flashcards (developed with AI assistance for rapid prototyping).
Flashcards are an effective tool for studying and memorizing concepts. Perfect for developers, students, and anyone who wants to learn efficiently.

I got inspiration from [jwasham's flashcards](https://github.com/jwasham/computer-science-flash-cards).
I've kept realy simple to be able to deploy in any simple server (Coolify, Vercel, Netlifly, etc...). But it's not static, so you can't deploy it to a simple static server (actually you can if you want to read-only mode).

And, basically you should put your flashcards at `/public/flashcards` as JSON files and update the `manifest.json`. Done, cards will load properly.

You can check the existent ones on this repo at `/data/flashcards/`, don't forget to add some after deploy or at dev on `public/flashcards` folder.

## Features

- **🔒 Authentication**: Login with username and password (default: `admin` / `flashcards123`) change it in `.env.local` file or set it in the `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables.
- **🌙 Dark Mode**: Toggle between light and dark themes
- **✏️ Rich Text Editor**: Create cards with Markdown support and syntax highlighting
- **🔄 Study Mode**: Flip cards to test your knowledge (as normal flashcards)
- **📖 Browse Mode**: View and manage all your cards as List
- **🔍 Search**: Find specific cards quickly
- **📱 Responsive**: Works on desktop and mobile devices
- **🔄 FSRS**: Flashcard Spaced Repetition System (it looks a nice addition, but Im testing it as a BETA feature)

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing experience
- **React Markdown** - Markdown rendering
- **Prism.js** - Syntax highlighting

## Troubleshooting

- If you have problems with statistics being wrong across datas, you should check the `manifest.json` file and make sure the `id` is unique for each card (between jsons files).

---

**Happy studying! 🎓**
