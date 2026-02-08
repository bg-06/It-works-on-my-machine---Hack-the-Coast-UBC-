# VanConnect (Hack the Coast UBC)

VanConnect is a lightweight matching and chat app that helps UBC students find group activities and coordinate events.
It pairs students based on availability and social style, lets them swipe through locations, chat in groups, and schedule meetups.

## What It Does

- **Onboarding**: Collects availability (days/times) and personality/social style to improve matching.
- **Swipe & Match**: Browse location cards by goal and match into small groups.
- **Group Chat**: Chat with group members and get suggestions.
- **Calendar**: View upcoming group events and create/adjust event details.

## Quick Start

From the project root:

```bash
cd vanconnect
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Structure

- `vanconnect/` — Next.js app (UI, API routes, models)
- `README.md` — this file

## Notes

- Uses MongoDB (see `.env.local` inside `vanconnect/`).
- Preferences and matching are stored in Mongo collections (users, preferences, groups, messages, locations).
