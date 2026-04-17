# 🏅 Wheelchair Rugby Tournament Manager

A comprehensive web application for managing wheelchair rugby tournaments and sports club team. Streamline tournament planning, team management, and match scheduling all in one place.

## ✨ Key Features

- 🎯 **Tournament Management** - Create and manage wheelchair rugby tournaments with detailed scheduling and match tracking
- 👥 **Team & Player Management** - Add players, coaches, and staff to your sports club
- 🏆 **Match Planning** - Organize matches, assign referees, and manage game schedules
- 📋 **Reports & Printing** - Generate professional reports and printable documents
- ⚙️ **Settings** - Customize personnel information and tournament preferences

## 🚀 Project Versions

- **v.1** - Core tournament manager for planning wheelchair rugby competitions
- **v.2** - Extended with simple team and player management system for sports clubs

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Astro
- **Styling**: Modern CSS and component-based design
- **Testing**: Unit tests for key components
- **State Management**: React hooks and context

## 📁 Project Structure

```
src/
├── features/              # Feature modules
│   ├── club/             # Club and team management
│   ├── tournaments/      # Tournament planning and details
│   └── settings/         # Application settings
├── components/           # Shared UI components
└── lib/                  # Utility functions
```

## 🎮 Main Features Overview

### Tournaments

- Create and plan tournaments
- Schedule matches and assign referees
- Track tournament progress
- View detailed match information

### Clubs & Teams

- Manage club information
- Add players and personnel
- Organize teams within clubs
- View Player skills

### Utilities

- Print tournament reports and schedules
- Generate match sheets

## 📝 Getting Started

1. Install dependencies with `pnpm install`.
2. Verify the `.env` file (or `.env.example`) provides a `DATABASE_URL` that points at your PostgreSQL instance and any other secrets you expect to override.
3. Run `pnpm prisma generate` so that `@prisma/client` can load the generated runtime (`.prisma/client/default` is missing until you do this).
4. (Optional) Seed the database with `pnpm run db:seed`.
5. Start the dev server via `pnpm run dev`.

> ⚠️ Whenever you reinstall dependencies or change the Prisma schema, rerun `pnpm prisma generate` before starting Astro. Skipping this step triggers the “Cannot find module '.prisma/client/default'” error when the API tries to instantiate `PrismaClient`.

---

**Built for the wheelchair rugby community** 🏆
