# ArcPilot

![Repo Size](https://img.shields.io/github/repo-size/siiigure/ArcPilot?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/siiigure/ArcPilot?style=flat-square)
![License](https://img.shields.io/github/license/siiigure/ArcPilot?style=flat-square&color=blue)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)

ArcPilot is a community + AI helper project for geospatial and domain-specific workflows.

Project status: **active development**.

![Current homepage (Light theme)](img/home-light.png)

---

## What This Project Is For

This project focuses on three practical issues:

- GIS/CAD troubleshooting info is spread across too many sources
- Standards/spec documents are hard to search and quote quickly
- General discussion platforms usually don’t carry spatial context well

ArcPilot is meant to be one place for discussion, references, and AI-assisted workflows.

---

## Current Scope

### Implemented

- Community basics: posts, replies, tags, user system
- Split architecture: `frontend/` + `backend/`
- Runnable backend API and data model foundation (FastAPI + SQLModel)
- Core frontend pages and interactions
- Light/Dark theme switch

### In Progress / Not Finished

- Deeper RAG integration
- End-to-end citation completeness
- Full E2E stability (Playwright)

---

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + Python
- Data layer: PostgreSQL / PostGIS + SQLModel
- Tooling: `bun` (frontend), `uv` (backend)

---

## Project Structure

```text
ArcPilot/
├── backend/
├── frontend/
├── docs/
├── deploy/
├── scripts/
├── compose.yml
```

---

## Local Development

### 1) Backend

```bash
cd backend
uv sync
uv run fastapi run app/main.py --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
bun install
bun run dev
```

---

## Testing and Checks

### Backend

```bash
cd backend
uv run pytest
```

### Frontend

```bash
cd frontend
bun run lint
bun run build
```


