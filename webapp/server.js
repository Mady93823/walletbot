import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Middleware to set cache control headers
const setCacheControl = (res, path) => {
  if (path.endsWith('.html')) {
    // HTML files: No cache, must revalidate
    res.setHeader('Cache-Control', 'no-cache');
  } else if (path.includes('/assets/') || path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    // Static assets (hashed by Vite): Long cache (1 year)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // Others: Default short cache
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
};

// Serve static files from dist directory
app.use(express.static(DIST_DIR, {
  setHeaders: setCacheControl
}));

// SPA Fallback: Serve index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving static files from ${DIST_DIR}`);
});
