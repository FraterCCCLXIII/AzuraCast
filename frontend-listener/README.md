# frontend-listener

Custom listener-facing frontend for AzuraCast, built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- shadcn/ui components

## Local development

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Update `.env.local` if your AzuraCast URL or station shortcode differs.

3. Install dependencies and run:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `NEXT_PUBLIC_AZURACAST_BASE_URL`  
  Base URL of your AzuraCast instance (for local Docker setup: `http://127.0.0.1`).

- `NEXT_PUBLIC_AZURACAST_STATION_SHORT_NAME`  
  Station short name used for station-specific now-playing polling.

## Current features

- Now Playing card with artwork and elapsed/duration progress.
- Play/Pause shell with station stream URL.
- Recent tracks list from `song_history`.
- Polling-based metadata refresh with graceful empty/error states.

## API endpoints used

- `/api/nowplaying/{stationShortName}`
- `/api/nowplaying` (fallback when station endpoint returns 404)

## Validation commands

```bash
npm run lint
npm run build
```
