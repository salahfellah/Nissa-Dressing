# Nissa Dressing

A React + TypeScript + Vite + Tailwind CSS project combining:
- **Auth flow** (splash screen, login, multi-step signup with an eligibility/"voile" check and a mock audio-verification step)
- **Marketplace** (browsable catalog with category filters, product cards, trust/value sections)

The two flow into one app: completing login or signup (or hitting the demo shortcut button) reveals the marketplace. There's a "Quitter" (logout) icon in the marketplace header to jump back to the auth flow.

## Requirements
- [Node.js](https://nodejs.org/) 18+ (includes npm)

## Setup

```bash
# 1. Unzip the project, then open the folder in VS Code
cd nissa-dressing

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open the URL Vite prints (usually **http://localhost:5173**) in your browser.

## Project structure

```
nissa-dressing/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx          # React entry point
    ├── App.tsx           # Top-level: switches between AuthFlow and Marketplace
    ├── index.css         # Tailwind directives + fonts + fade-in animation
    └── components/
        ├── AuthFlow.tsx     # Splash / Login / Signup
        └── Marketplace.tsx  # Product catalog page
```

## Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Notes
- All product images are placeholders from `placehold.co`. Swap the `image` URLs in `Marketplace.tsx` with real product photos when ready.
- The login/signup forms are UI-only simulations (no backend yet) — `handleSubmit` just logs to the console and moves the user forward. Wire these up to a real API/auth provider when you're ready to launch.
- Icons come from [`lucide-react`](https://lucide.dev/).
