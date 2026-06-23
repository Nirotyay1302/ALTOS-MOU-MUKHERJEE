# Altos Distributor Website

A simple product website and minimal backend for selling Altos products.

- Responsive product catalog
- Search and category filtering
- Add-to-cart and checkout flow
- Simple admin dashboard for orders

## Files

- `index.html` — customer storefront
- `cart.html` — shopping cart
- `checkout.html` — checkout page
- `admin.html` — admin login and order dashboard
- `styles.css` — site design and layout
- `products.js` — product data
- `app.js` — cart, checkout, and admin logic
- `server.js` — minimal Express server and API
- `database.js` — local SQLite persistence helpers

## Prerequisites

- Node.js 14+ and npm

## Install

1. Open the `d:\ALTOS` folder in VS Code or a terminal.
2. Install dependencies:

```powershell
npm install
```

## Run

- Start the server:

```powershell
npm start
```

- Development with auto-reload:

```powershell
npm run dev
```

Then open `http://localhost:3000` (or the port shown by the server) in your browser.

## Admin

Visit `admin.html` and login with the demo credentials:

- username: `admin`
- password: `admin123`

## CI

This repository includes a basic GitHub Actions workflow that installs dependencies and runs the `test` script if present.

## Release

A lightweight release/tagging strategy is used. The repository contains an annotated tag pushed as `v0.1.0`.

## Notes

- This project stores demo data locally (SQLite and browser `localStorage`). For production use, add authentication, secure payment integration, and a hosted DB.

## License

See the repository license or add one if you need explicit licensing.
