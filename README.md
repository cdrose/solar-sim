# ☀️ Solar Sim

A browser-based home solar system simulator. Configure your household usage profile, size your solar + battery setup, and estimate costs, savings, and payback periods — no backend required.

**Live demo:** https://cdrose.github.io/solar-sim/

---

## Features

- **Daily usage profile** — adjust morning, midday, evening and overnight consumption with sliders, or pick from preset household profiles
- **Solar configuration** — set panel capacity (kW), battery storage (kWh) and system costs
- **Simulation** — run summer/winter × sunny/cloudy day scenarios to see:
  - Solar direct usage, battery discharge and grid import
  - Energy exported to the grid
- **Cost & payback** — enter panel, inverter and battery pricing to calculate estimated annual savings and payback period

---

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

## Building for production

```bash
npm run build       # output in dist/
npm run preview     # preview the production build locally
```

---

## Deploying to GitHub Pages

Deployments are automated via `.github/workflows/deploy.yml`. Any push to `main` triggers a build and deploy.

To set up on a new repo:
1. Push to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. The workflow runs automatically — site is live at `https://<user>.github.io/<repo>/`

The `GITHUB_PAGES=true` environment variable in the workflow activates the correct base path in `vite.config.js`.

---

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/) for charts
- [MUI](https://mui.com/) for UI components
