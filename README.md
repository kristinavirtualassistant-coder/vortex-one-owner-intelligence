# Vortex One Owner Intelligence & Property Search Platform

Production-oriented property intelligence architecture powered by PostgreSQL + PostGIS, verified source registries, provenance tracking, repository services, and real database-backed persistence for California counties (Orange County operational).

## Prerequisites

1. Node.js (v18+)
2. PostgreSQL (v14+) with PostGIS extension enabled (`CREATE EXTENSION postgis;`)

## Environment Variables

Copy `.env.example` to `.env` and fill in your connection credentials and Gemini API key:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vortex_one
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

## Setup & Database Initialization

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run database migrations and seed operational counties & source registry:
   ```bash
   npm run db:seed
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Production Build & Start

```bash
npm run build
npm start
```
