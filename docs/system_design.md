# Technical Design Document: Tí Coolture

## 1. Executive Summary & Overview
**Tí Coolture** is a minimalist digital curation and startup platform connecting local cultural businesses in Vietnam with modern conscious consumers. The application acts as a discovery portal for traditional/modern crafts (like ceramics, hand-woven textiles, and lacquerware) and curated tourist routes, paired with comprehensive shop-level dashboards, admin moderation tools, and automated system webhook simulation.

---

## 2. Technology Stack & Framework Choices

### 2.1 Frontend Tier
* **Core Library:** `React 19.0.1` (Functional component design leveraging modern Hooks and high-performance State management).
* **Programming Language:** `TypeScript` (TS 5.8+) compiled with strict type safety, modular entity interfaces, and early interface declarations.
* **Styling Framework:** `Tailwind CSS` (integrated directly via `@tailwindcss/vite` plugin for optimized CSS injection and minimal design fatigue).
* **Navigation Router:** `React Router DOM` (v7.18.1) configured with declarative public and authenticated routes.
* **Icons Library:** `Lucide React` (unified minimalist line-art icon framework).
* **Animation Suite:** `Motion` (formerly Frame Motion) imported via `motion/react` for smooth state-driven animations, page cross-fades, and interactive ripple effects.

### 2.2 Backend Tier
* **Application Framework:** `Express 4.21.2` (Lightweight Node.js web framework handling REST routing, static asset distribution, and log management).
* **Development Engine:** `tsx` (TypeScript Execute tool that runs TypeScript files natively on the Node runtime in development).
* **Production Bundler:** `esbuild 0.25.0` (Fast bundler configured to compile the backend code into a single, high-performance CommonJS `dist/server.cjs` file to bypass strict Node runtime ESM checks and maximize cold-start speeds on serverless runners).

### 2.3 Database & Authentication Tier
* **Cloud Database:** `Firebase Firestore` (NoSQL Document Store providing real-time data streaming, automatic horizontal scaling, offline support, and low latency queries).
* **Identity Management:** `Firebase Authentication` (Client-driven secure sign-up, login, and token handling with Firebase Auth SDK).

---

## 3. High-Level System Architecture

Tí Coolture is designed as an **integrated full-stack application** hosted inside a secure container environment.

```
       +-----------------------------------------------------------+
       |                       Client Browser                      |
       |  +--------------------+  +-----------------------------+  |
       |  |  React UI Engine   |  |   Firebase Web Client SDK   |  |
       |  +---------+----------+  +--------------+--------------+  |
       +------------|----------------------------|-----------------+
                    | (HTTP /api/* API Requests) |
                    v                            |
       +------------+--------------+             | (Direct Firestore
       |  Express & Vite Backend   |             |  & Firebase Auth
       |       (Port 3000)         |             |  Streaming Calls)
       |  +---------------------+  |             |
       |  | Webhook API Routes  |  |             v
       |  | In-Memory Log Queue |  |   +---------+---------+
       |  +---------------------+  |   | Firebase Firestore|
       |  | Vite SPA Asset      |  |   |        &          |
       |  | Static Middleware   |  |   | Firebase Auth     |
       |  +---------------------+  |   +-------------------+
       +---------------------------+
```

### 3.1 Architectural Flows
1. **Curator/Buyer Discovery Flow:** Users visit the curated product store or interactive tourist routes. Any click-through or page-view fires silent metrics to Firebase Firestore and records telemetry events via backend Express APIs.
2. **Shop Registry & Dashboard Flow:** Shop owners log in, fill in registration forms, create social configurations, and submit products. High-fidelity webhooks are simulated on product creation or update, piping real-time payloads to a visual simulation terminal.
3. **Admin Approval & Auditing Flow:** Platform moderators approve, reject, or request changes on shops and products. Every moderation activity changes live Firestore states and triggers automated audit logs visible on the Webhook Terminal.
4. **Autonomous Interactive Tracking:** All button clicks are classified dynamically at the top-level React hook (`App.tsx`), parsing SVG/Lucide classes or parent nodes to resolve semantic button names, preventing "unlabeled button" gaps in telemetry logs.

---

## 4. Key Engineering & Design Decisions

### 4.1 Hybrid Cloud & Memory Storage
* **Decision:** Keep long-term state (Products, Stores, Routes, Clicks, User Roles) in Firestore, but store transient webhook simulation logs in-memory within the Express server process.
* **Rationale:** This drastically reduces Firebase read/write overhead for non-critical developer simulation data, prevents database schema pollution, and allows instantaneous log clearing upon container recycling.

### 4.2 Single Bundled CommonJS Output for Server
* **Decision:** Build and compile `server.ts` into a unified `dist/server.cjs` file using `esbuild`.
* **Rationale:** Relative path imports in native Node.js ES Modules (`"type": "module"`) strictly require explicit `.js` suffixes which breaks typical TypeScript compile-and-run workflows. Bundling the server into a single file with external package markers bypasses this, provides inline sourcemaps for runtime debug support, and shortens container cold-starts.

### 4.3 Semantic Auto-Labeling of Buttons
* **Decision:** Intercept clicks on `App.tsx` globally and dynamically infer labels (e.g., detecting SVG `lucide-` classes, surrounding heading tags, or ID parameters) before recording button events to Firestore.
* **Rationale:** Traditional analytics often result in "unlabeled button" entries if developers fail to set standard `aria-label` tags. This layout-aware algorithm fallback recovers readable button names automatically.

### 4.4 Lazy SDK Initialization Strategy
* **Decision:** Client-side credentials and Firebase connections are initialized at startup, but third-party APIs and platform integrations utilize checking patterns (`if (process.env.VAR) ...`) to avoid server crash states.
* **Rationale:** Protects the development container from crashing if an optional secret key is temporarily omitted during environment setups.
