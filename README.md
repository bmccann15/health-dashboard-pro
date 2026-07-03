# Health Dashboard Pro

A personal weight loss, calorie, macro, activity, and trend dashboard built with React, Vite, TypeScript, and the McCann Apps design style.

## What is included

- Daily dashboard for calories, protein, carbs, fat, fiber, sugar, activity calories, weight, and goal progress
- Manual food/meal entry
- Save entries as favorites for quick reuse later
- Activity tracking by type and calories burned
- Weight tracking
- Weekly and monthly trend summaries
- Local browser storage
- Export/import backup
- PWA manifest and icons
- GitHub Pages deployment workflow

## GitHub setup

Create a GitHub repository named exactly:

```text
health-dashboard-pro
```

Then copy these project files into the repository, commit, and push.

In GitHub, go to:

```text
Settings > Pages > Build and deployment > Source
```

Set Source to:

```text
GitHub Actions
```

The app is configured for this GitHub Pages URL format:

```text
https://bmccann15.github.io/health-dashboard-pro/
```

## Local development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Important

Do not commit `node_modules` or `dist`. They are intentionally ignored by `.gitignore`.
