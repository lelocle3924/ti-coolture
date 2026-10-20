import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const pathname = urlObj.pathname;

          // Check direct file or index file
          let filePath = path.resolve(__dirname, '.' + pathname + '.ts');
          if (!fs.existsSync(filePath)) {
            filePath = path.resolve(__dirname, '.' + pathname + '/index.ts');
          }
          if (!fs.existsSync(filePath)) {
            return next();
          }

          // Parse body if present
          let body: any = {};
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const rawBody = Buffer.concat(chunks).toString();
            if (rawBody.trim()) {
              try {
                body = JSON.parse(rawBody);
              } catch {
                body = rawBody;
              }
            }
          }

          const enhancedReq: any = req;
          enhancedReq.body = body;
          enhancedReq.query = Object.fromEntries(urlObj.searchParams);

          const enhancedRes: any = res;
          enhancedRes.status = (code: number) => {
            enhancedRes.statusCode = code;
            return enhancedRes;
          };
          enhancedRes.json = (data: any) => {
            enhancedRes.setHeader('Content-Type', 'application/json');
            enhancedRes.end(JSON.stringify(data));
            return enhancedRes;
          };

          const mod = await server.ssrLoadModule(filePath);
          if (mod && typeof mod.default === 'function') {
            await mod.default(enhancedReq, enhancedRes);
          } else {
            next();
          }
        } catch (err: any) {
          console.error('[API Middleware Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [apiMiddlewarePlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
