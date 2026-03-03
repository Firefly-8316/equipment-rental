# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MERN stack (MongoDB, Express 5, React 19, Node.js) equipment rental management system. Monorepo with two independent packages: `client/` (Vite + React) and `server/` (Express + Mongoose). No shared workspace config — each must be managed separately.

## Development Commands

### Server (`server/` directory)
- **Start dev server:** `npm run dev` (uses nodemon, runs on port 5000)
- **Start production:** `npm start`
- **Seed admin user:** `npm run seed`
- **Seed equipment manager:** `npm run seed:em`
- **Seed regular user:** `npm run seed:user`
- No test framework is configured yet.

### Client (`client/` directory)
- **Start dev server:** `npm run dev` (Vite, proxies `/api` to `localhost:5000`)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint)
- No test framework is configured yet.

### Environment Setup
The server requires a `.env` file (see `server/.env.example`). Required variables: `MONGO_URI`, `JWT_SECRET`. Optional: `PORT` (defaults to 5000), seed credentials.

## Architecture

### Three User Roles
Roles are stored as strings on the User model (`user`, `admin`, `equipment_manager`). Authorization is enforced via middleware in `server/middleware/auth.js`:
- `protect` — verifies JWT from `Authorization: Bearer <token>` header, attaches `req.user`
- `admin` — requires `role === 'admin'`
- `equipmentManager` — allows both `admin` and `equipment_manager` (normalizes role string to lowercase with underscores before comparison)

### API Route Structure
All routes are mounted under `/api` in `server/server.js`:
- `/api/auth` — register/login (public)
- `/api/equipment` — CRUD; GET is public, mutations require `equipmentManager` middleware
- `/api/bookings` — user bookings; includes cancel (`POST /:id/cancel`), penalty payment (`POST /:id/penalty/pay`), and status/payment updates (`PATCH /:id` — manager only)
- `/api/admin` — stats, user listing, role changes (all routes use `protect` + `admin` at router level)
- `/api/equipment-manager` — stats endpoint (uses `protect` + `equipmentManager` at router level)

### Booking Lifecycle
Status transitions are enforced in `server/routes/bookings.js` PATCH handler:
`Booked → Rented → Returned`. Cancellation is a separate endpoint (`POST /:id/cancel`, owner only, only from `Booked`). Late-return penalty is auto-calculated on return using `penaltyPerDay` from the equipment. Status/payment reverts are allowed within a 1-minute window.

### Client Architecture
- **Routing:** React Router v7 in `client/src/App.jsx`. Role-based route protection via `ProtectedRoute` (props: `userOnly`, `adminOnly`, `equipmentManagerOnly`) and `GuestOnly` wrapper components.
- **Auth state:** React Context (`client/src/context/AuthContext.jsx`). JWT token and user object stored in localStorage. Provides `login`, `register`, `logout` functions.
- **API layer:** Thin fetch wrapper in `client/src/services/api.js`. All requests go to `/api` (Vite proxy forwards to Express in dev). Auto-attaches Bearer token.
- **Admin pages** are nested routes under `/admin` (dashboard, equipment, bookings, users).
- **Equipment Manager pages** are nested routes under `/equipment-manager` (overview, equipment, bookings).
- Each page component has a co-located `.css` file with the same name.

### Data Models (server/models/)
- **User:** name, email (unique), password (bcrypt-hashed in route handlers, not in schema hooks), role
- **Equipment:** name, rentalPrice, category, imageURL, isAvailable, condition (`Good`/`Damaged`/`Unavailable`), penaltyPerDay
- **Booking:** references User and Equipment, tracks startDate/endDate, rentalType (`hours`/`days`), rentalDuration, totalAmount, status, paymentStatus, penalty fields. Equipment `isAvailable` is toggled on booking creation, cancellation, and status changes.

## Conventions
- Server uses CommonJS (`require`/`module.exports`); client uses ES modules.
- CSS is plain (no CSS modules, no Tailwind) — one `.css` file per component/page.
- No TypeScript — both client and server are plain JavaScript (`.js`/`.jsx`).
- Password hashing is done in route handlers, not in Mongoose pre-save hooks.
