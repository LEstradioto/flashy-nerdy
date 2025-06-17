# Flashy Nerdy 🤓


https://github.com/user-attachments/assets/253fe56b-da2d-4a84-9f81-6a8fab0f5daa


Flashcards are an effective tool for studying and memorizing concepts. Perfect for developers, students, and anyone who wants to learn efficiently.

I got inspiration from [jwasham's flashcards](https://github.com/jwasham/computer-science-flash-cards).
I've kept realy simple to be able to deploy in any simple server (Coolify, Vercel, Netlifly, etc...). But it's not static, so you can't deploy it to a simple static server (actually you can if you want to read-only mode).

## 📁 Flashcard Data Structure

- **`data/flashcards/`** – Source decks in the repository that serve as _seed_ data. You can commit changes here if you want to ship new default decks.
- **`data/flashcards/` (runtime)** – The same path is used by the app for _live_ reading & writing while you run it locally. We `.gitignore` this folder so your personal progress never ends up in version-control.

Docker images bundle the seed decks under `/app/default-flashcards` (read-only).  When the container starts for the very first time the entry-point copies them into `/app/data/flashcards`.  That directory is where the application reads and writes at runtime and it persists between container restarts.

To add your own flashcards locally:
1. Drop JSON files into `data/flashcards/` and update `manifest.json`.
2. Or just use the UI – the app writes the files for you.  They will land in that same folder (ignored by git).

Inside Docker you normally use the UI; the files are written to the volume at `/app/data/flashcards`.

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

A weekend project built for studying with flashcards (developed with AI assistance for rapid prototyping).

## 🚀 Deployment

### Docker (recommended)

```
docker compose up -d
```

The compose file creates a named volume `flashcards-data` that is mounted to `/app/data/flashcards` inside the container. Your decks and progress survive image rebuilds and container restarts.

### Vercel / Netlify (stateless)

Serverless platforms work fine but remember that the filesystem is read-only – any changes you make through the UI will disappear after each deploy.  Stick to Docker if you need persistence without a database.

## Troubleshooting

- If you have problems with statistics being wrong across datas, you should check the `manifest.json` file and make sure the `id` is unique for each card (between jsons files).

---

**Happy studying! 🎓**
