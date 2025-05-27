# Flashy Nerdy 🤓


https://github.com/user-attachments/assets/253fe56b-da2d-4a84-9f81-6a8fab0f5daa


Flashcards are an effective tool for studying and memorizing concepts. Perfect for developers, students, and anyone who wants to learn efficiently.

I got inspiration from [jwasham's flashcards](https://github.com/jwasham/computer-science-flash-cards).
I've kept realy simple to be able to deploy in any simple server (Coolify, Vercel, Netlifly, etc...). But it's not static, so you can't deploy it to a simple static server (actually you can if you want to read-only mode).

## 📁 Flashcard Data Structure

- **`data/flashcards/`** - Example/seed flashcard data (tracked in git)
- **`public/flashcards/`** - Runtime flashcard data (not tracked in git)

The app reads from `public/flashcards/` at runtime. During build/deployment, example data from `data/flashcards/` is automatically copied to `public/flashcards/` if it doesn't exist.

To add your own flashcards:
1. Add JSON files to `data/flashcards/` (for version control)
2. Update `data/flashcards/manifest.json` with your file names
3. For Docker deployments, you can also edit directly in the app

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

Choose your preferred deployment method:

- **Vercel or Netlify** - Quick serverless deployment (data resets on redeploy)
- **Docker** - Full control with persistent data
-
## Troubleshooting

- If you have problems with statistics being wrong across datas, you should check the `manifest.json` file and make sure the `id` is unique for each card (between jsons files).

---

**Happy studying! 🎓**
