# mapstash-back

Dedicated Next.js backend for Mapstash.

## Scripts

- `pnpm dev`: start the backend locally on `http://localhost:3000`
- `pnpm build`: create a production build
- `pnpm start`: run the production server
- `pnpm lint`: run ESLint

## First endpoints

- `GET /api/health`: simple health check returning JSON
- `GET /api/address-autocomplete?q=...&limit=5`: server-side address suggestions powered by Photon

## Notes

This app uses the Next.js App Router and keeps source files under `src/`.
Set `PHOTON_API_URL` in `.env.local` if you want to override the default upstream URL (`https://photon.komoot.io/api`).
