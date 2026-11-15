# SolarShield

SolarShield is a React + TypeScript dashboard for making space-weather data easier to understand. It includes live-monitoring activity metrics, event filters, impact indicators, educational context and a transparent next-24-hour awareness simulation.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Available scripts

```bash
npm run build   # type-check and create a production build
npm run lint    # run Oxlint
npm run preview # preview the production build
```

## Data sources and simulation

- NASA DONKI supplies solar flares, CMEs and geomagnetic-storm event records.
- NOAA SWPC supplies the planetary Kp index.
- NASA APOD is loaded as optional educational context.
- If a feed is unavailable, the dashboard falls back to representative data and shows a fallback notice.
- The displayed percentage is an explainable heuristic simulation based on recent flare/CME counts and Kp. It is not a trained machine-learning model, an official forecast or an emergency alert.

For production, set `VITE_NASA_API_KEY` in the environment or move API requests behind a server-side proxy. Do not commit API keys.
