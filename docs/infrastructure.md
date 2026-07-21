# Infrastructure & Deployment Documentation: Tí Coolture

This document details the sandboxed hosting runtime, network ingress rules, compilation process, and external service bindings for the Tí Coolture platform.

---

## 1. Runtime Environment & Network Layout

The application executes inside a secure, containerized serverless environment on **Cloud Run**, structured behind an infrastructural reverse proxy layer.

```
                  +-----------------------------------+
                  |        External Client UI         |
                  +-----------------+-----------------+
                                    |
                                    | (Inbound HTTPS Request)
                                    v
                  +-----------------+-----------------+
                  |      Nginx Reverse Proxy          |
                  |     (Public Router Port)          |
                  +-----------------+-----------------+
                                    |
                                    | (Forwards to Internal Port 3000)
                                    v
                  +-----------------+-----------------+
                  |   Serverless Docker Container     |
                  |   +----------------------------+  |
                  |   | Express & Vite Dev/Prod    |  |
                  |   | Server Binding (0.0.0.0)   |  |
                  |   +----------------------------+  |
                  +-----------------------------------+
```

### 1.1 Port & Bind Constraints
* **Hardcoded Port Restriction:** Port `3000` is the **ONLY** externally accessible port.
* **Binding Rules:** In both development and production phases, the Express/Node server MUST bind strictly to port `3000` on interface `0.0.0.0`.
* **Important Note:** Any attempt to configure other conventional local ports (such as `5173`, `3001`, or `8080`) will disconnect container ingress routing and cause gateway timeouts.

---

## 2. Production Build & Execution Process

Deployments execute a standardized two-step sequence inside the deployment pipeline: **Build Phase** followed by the **Production Boot Phase**.

### 2.1 The Build Phase (`npm run build`)
The compilation chain uses a high-performance dual-step build process:
```bash
vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
```

1. **Client Bundling (`vite build`):**
   * Vite parses `/index.html` and entry-point `src/main.tsx`.
   * It compiles and treeshakes TypeScript/TSX code, runs CSS compression, and compiles Tailwind CSS.
   * Outputs static browser distribution files into `/dist` (including `assets/` with uniquely-hashed JS/CSS filenames).
2. **Server Compilation (`esbuild server.ts ...`):**
   * Bundles backend `server.ts` dependencies.
   * Compiles output as a high-efficiency **CommonJS** module to `/dist/server.cjs`.
   * Uses `--packages=external` to keep native node modules (such as Express) separate.
   * Includes sourcemaps (`--sourcemap`) for runtime error debugging.

### 2.2 Boot Execution Phase (`npm start`)
Once built, the runtime boots simply by launching the compiled Express wrapper:
```bash
node dist/server.cjs
```
This serves:
* Custom REST endpoints (`/api/webhooks/*`) immediately.
* Browser static files from `/dist` inside the Express static serving middleware.
* Router fallback matching (`app.get('*', ... -> sendFile('index.html'))`) to support seamless SPA client-side routing.

---

## 3. Secret Management & Environment Configuration

All system configurations and key-value credentials are dry-run declared inside `.env.example` at the workspace root:

```env
# .env.example
# Declares necessary variables for full-stack functionality without leaking active credentials.
```

* **Client-Side Public Variables:** Variables prefixing with `VITE_` are packed directly by Vite and exposed to the browser.
* **Backend Secrets:** Core secrets are accessed directly via Node's `process.env` on server-side modules to hide credentials from developer inspection consoles or client bundles.

---

## 4. Firebase Cloud Database Integration

Connections to Firebase Authentication and Cloud Firestore are bridged through the SDK config in `/src/lib/firebase.ts`. 

The credentials loaded by the client are stored locally inside the project configuration manifest (`firebase-applet-config.json`):
```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```
This keeps database endpoints fully decoupled from code repositories, making it highly secure and standard-compliant.
