import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Webhook log simulation store (In-memory log cache for rapid visual checks)
  const webhookLogs: any[] = [];

  app.get("/api/webhooks/logs", (req, res) => {
    res.json(webhookLogs);
  });

  app.post("/api/webhooks/trigger", (req, res) => {
    const { action, payload, timestamp } = req.body;
    const logEntry = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      payload,
      timestamp: timestamp || new Date().toISOString()
    };
    webhookLogs.unshift(logEntry);
    if (webhookLogs.length > 100) {
      webhookLogs.pop(); // Keep last 100 logs
    }
    console.log(`[Webhook Triggered] ${action}:`, payload);
    res.status(200).json({ success: true, log: logEntry });
  });

  // Serve static assets or compile with Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
