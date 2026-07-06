# PixShare (MERN)

Role-based image-sharing app rebuilt as a **MERN** stack:
**MongoDB + Express + React + Node.js**.

- `server/` — Node/Express REST API with MongoDB (Mongoose), JWT auth, bcrypt password hashing, file uploads and cached static delivery.
- `client/` — React (Vite) SPA with React Router and TanStack Query for client-side caching.

> Heads up: this machine only has Python installed. To run this stack you need
> **Node.js 18+** and **MongoDB** (local) or a **MongoDB Atlas** connection string.

---

## Features

- Three roles — **admin** (full access + user management), **editor** (post + manage own), **viewer** (read-only). Enforced on both client and server.
- Public **registration** that always creates **viewer** accounts (role is forced server-side).
- `.env`-driven branding served from the API (`GET /api/config`) so name/colors live in one place.
- Image upload (file or URL), likes, image detail, profile stats, admin console.
- Caching at two layers (see below).

---

## Prerequisites

- Node.js 18+ and npm
- MongoDB: either local (`mongod`) or a free MongoDB Atlas cluster

---

## Run locally

Open two terminals.

**1) API**
```bash
cd pixshare-mern/server
cp .env.example .env      # adjust MONGODB_URI / JWT_SECRET if needed
npm install
npm run seed              # creates demo users + images
npm run dev               # http://localhost:4000
```

**2) Client**
```bash
cd pixshare-mern/client
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # http://localhost:5173
```

### Demo accounts

| Role   | Email             | Password    |
| ------ | ----------------- | ----------- |
| Admin  | `admin@demo.app`  | `admin123`  |
| Editor | `editor@demo.app` | `editor123` |
| Viewer | `viewer@demo.app` | `viewer123` |

---

## Do we need a database? Yes.

The previous Flask demo used local files, which doesn't hold up in production
(no concurrent-safe writes, no querying, no horizontal scaling). This rebuild
uses **MongoDB** via Mongoose:

- `User` collection — accounts and roles (email is uniquely indexed).
- `Image` collection — posts, with `likedBy` as an array of user references.

For local dev, run MongoDB on your machine. For production, the simplest path is
**MongoDB Atlas** (managed, free tier available): create a cluster, get the
`mongodb+srv://...` URI, and set it as `MONGODB_URI`.

## Where are passwords stored?

Passwords are **never stored in plain text**. On registration/creation the
password is hashed with **bcrypt** (`bcryptjs`, cost factor 10) and only the
hash is saved in the `passwordHash` field. The field is stripped from every API
response via the model's `toJSON` transform. Login verifies the submitted
password against the stored hash with `bcrypt.compare`.

Auth is stateless: a successful login returns a **JWT** (signed with
`JWT_SECRET`) that the client stores and sends as a `Bearer` token. The server
re-loads the user on each request so role changes take effect immediately.

## Caching strategy

- **API data (client):** TanStack Query caches GET responses, de-dupes requests
  and refetches in the background (`staleTime` 30s). Mutations (like/post/delete)
  invalidate the relevant queries so the UI stays consistent.
- **Images (HTTP):** uploaded files are served by Express with
  `Cache-Control: public, max-age=<IMAGE_CACHE_SECONDS>, immutable`, and the
  `/api/config` response is cached for 5 minutes. `<img loading="lazy">` defers
  off-screen image loads.

---

## API reference

| Method | Endpoint                | Auth / capability      | Purpose |
| ------ | ----------------------- | ---------------------- | ------- |
| GET    | `/api/config`           | public                 | Branding + role matrix |
| GET    | `/api/health`           | public                 | Health check |
| POST   | `/api/auth/register`    | public                 | Create a viewer account |
| POST   | `/api/auth/login`       | public                 | Get a JWT |
| GET    | `/api/auth/me`          | authenticated          | Current user |
| GET    | `/api/images`           | authenticated          | List feed |
| GET    | `/api/images/:id`       | authenticated          | One image |
| POST   | `/api/images`           | `post`                 | Create (file or URL) |
| POST   | `/api/images/:id/like`  | authenticated          | Toggle like |
| DELETE | `/api/images/:id`       | owner or `deleteAny`   | Delete |
| GET    | `/api/users`            | `manageUsers`          | List users |
| POST   | `/api/users`            | `manageUsers`          | Create user (any role) |
| PATCH  | `/api/users/:id/role`   | `manageUsers`          | Change role |
| DELETE | `/api/users/:id`        | `manageUsers`          | Delete user |

---

## Deploying to production

A typical split deployment:

### 1. Database — MongoDB Atlas
Create a cluster, a DB user, allow your server's IP, and copy the
`mongodb+srv://...` connection string.

### 2. Backend — Node host (Render, Railway, Fly.io, a VM, etc.)
- Set environment variables: `MONGODB_URI`, a strong random `JWT_SECRET`,
  `CLIENT_ORIGIN` (your deployed client URL), and the `APP_*` branding values.
- Start command: `npm install && npm start` (runs `node src/index.js`).
- Uploaded files on ephemeral hosts are not durable — for production move
  uploads to object storage (S3 / Cloudinary) and store the returned URL.
  The current local-disk uploads are fine for a VM with a persistent volume.

### 3. Frontend — static host (Vercel, Netlify, S3+CloudFront)
- Set `VITE_API_URL` to the deployed API URL.
- Build: `npm install && npm run build` → deploy the `dist/` folder.

### Production checklist
- [ ] Strong, secret `JWT_SECRET` (rotate periodically)
- [ ] HTTPS everywhere; set `CLIENT_ORIGIN` to lock down CORS
- [ ] MongoDB auth enabled + IP allowlist (Atlas does this by default)
- [ ] Run the API behind a process manager (pm2) or the platform's runtime
- [ ] Move uploads to object storage if the host has ephemeral disk
- [ ] Add rate limiting (e.g. `express-rate-limit`) on auth routes
- [ ] Seed or create the first admin, then disable/guard public admin creation

---

## Project structure

```
pixshare-mern/
├── server/                     # Node + Express + MongoDB API
│   ├── src/
│   │   ├── index.js            # app bootstrap, config route, cached uploads
│   │   ├── seed.js             # demo data seeder (npm run seed)
│   │   ├── config/             # db.js, roles.js (capability matrix)
│   │   ├── models/             # User.js, Image.js
│   │   ├── middleware/         # auth.js (JWT + capability), upload.js (multer)
│   │   ├── controllers/        # auth, image, user
│   │   └── routes/             # auth, images, users
│   └── uploads/                # served with immutable cache headers
└── client/                     # React (Vite) SPA
    └── src/
        ├── api/client.js       # axios instance + token + helpers
        ├── context/            # AuthContext, ConfigContext
        ├── components/         # Navbar, ImageCard, RoleBadge, ProtectedRoute, Spinner
        ├── pages/              # Login, Register, Feed, Post, ImageDetail, Profile, Admin
        └── lib/format.js       # initials + relative time
```
