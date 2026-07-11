# Data PDF Generator

Aplikasi inventory management dengan fitur export laporan ke PDF, Excel, dan Word.

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Express.js + Prisma ORM (Netlify Functions)
- **Database**: PostgreSQL (Neon.tech)
- **Deployment**:
  - Development: Docker (local)
  - Production: Monolith di Netlify (frontend + backend Netlify Functions, database di Neon.tech)

---

## Development (Local dengan Docker)

Docker digunakan hanya untuk development local agar lingkungan konsisten.

### Prasyarat

- Docker & Docker Compose terinstal

### Menjalankan Aplikasi

1. **Jalankan semua container**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```
   Atau di background:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

2. **Akses aplikasi**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api
   - Adminer (DB Management): http://localhost:8080

3. **Hentikan aplikasi**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```
   Untuk menghapus volume juga:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   ```

---

## Production Deployment (Monolith di Netlify)

### 1. Setup Database PostgreSQL di Neon.tech

Netlify Functions membutuhkan database PostgreSQL yang dapat diakses dari luar. Kita gunakan [Neon.tech](https://neon.tech) (free tier tersedia).

1. **Daftar/login ke [Neon.tech](https://neon.tech)**
2. **Buat project baru** → buat database PostgreSQL
3. **Simpan DATABASE_URL** (contoh: `postgresql://username:password@ep-cool-tree-123456.us-west-2.aws.neon.tech/inventory_db`)

### 2. Deploy ke Netlify

1. **Daftar/login ke [Netlify](https://netlify.com)**
2. **Tambahkan site baru** → pilih "Import from Git" (hubungkan ke repo GitHub kamu)
3. **Konfigurasi build**:
   - **Base directory**: `./`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Environment Variables**:
   - Tambahkan `DATABASE_URL` (dari Neon.tech)
   - Tambahkan `NODE_ENV=production`
   - Tambahkan `VITE_API_URL=/api` (karena backend di Netlify Functions di path yang sama)
   - Tambahkan variabel lain dari `.env.example` (JWT_SECRET, dll.)
5. **Deploy site**!
6. **Setelah deploy sukses**:
   - Buka **Site settings** → **Functions**
   - Kamu bisa cek apakah function `api` berjalan di bagian Functions log

---

## Project Setup (Manual Tanpa Docker)

### Install Dependencies

```bash
npm install
```

### Compile and Hot-Reload for Development

#### Frontend
```bash
npm run dev
```

#### Backend
```bash
npm run dev:api
```

### Type-Check, Compile and Minify for Production

```bash
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```bash
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev/)

```bash
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).
