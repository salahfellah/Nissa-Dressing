# Nissa Dressing

A React + TypeScript + Vite + Tailwind CSS project with each page split into its own file.

## Pages
- **SplashScreen** — welcome screen with "Se connecter" / "Créer un compte"
- **Login** — email/password sign-in
- **Signup** — 4-step wizard: eligibility question → info form → voice memo confirmation → success
- **Rejected** — shown if the eligibility question is answered "Non"
- **Home** — the marketplace catalog (category filters, product cards, trust/value sections)

## Requirements
- [Node.js](https://nodejs.org/) 18+

## Setup

```bash
cd nissa-dressing
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

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
    ├── main.tsx              # React entry point
    ├── App.tsx                # Top-level navigation between pages
    ├── types.ts                # Shared AppView type
    ├── index.css               # Tailwind directives, fonts, animations
    ├── theme/
    │   └── colors.ts            # Shared brand color tokens
    ├── components/ui/
    │   ├── Logo.tsx
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   └── VoiceMemoRecorder.tsx  # Mic recorder used in the signup flow
    └── pages/
        ├── SplashScreen.tsx
        ├── Login.tsx
        ├── Signup.tsx
        ├── Rejected.tsx
        └── Home.tsx
```

## What's new in this version
- **Each screen lives in its own file** under `src/pages/`, with shared pieces (Logo, Button, Input, colors)
  factored out into `src/components/ui/` and `src/theme/`.
- **"Pseudo" is now optional** in the signup form (no `required` attribute, and the `Input` component shows an
  "(optionnel)" hint automatically whenever a field isn't required).
- **New `VoiceMemoRecorder` component**: replaces the old mock audio button in step 3 of signup. It uses the
  browser's real microphone (`MediaRecorder` API) to record a short voice memo where the user confirms she wears
  the voile (hijab), with playback and re-record controls. If the browser/environment doesn't support mic access
  (e.g. no HTTPS, permission denied), it automatically falls back to a short simulated recording so the flow still
  works end-to-end for demo purposes.

## Build for production

```bash
npm run build
npm run preview
```

## Notes
- Product images are placeholders from `placehold.co` — swap the `image` URLs in `src/pages/Home.tsx` with real
  photos when ready.
- Login/signup are UI-only simulations (no backend) — hook them up to a real API/auth provider before launch.
- Microphone recording requires **HTTPS or `localhost`** in the browser; it will not work over plain HTTP on a
  remote host.
- Icons come from [`lucide-react`](https://lucide.dev/).
