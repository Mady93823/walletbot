# Asset Management Guidelines

This document outlines the standards and procedures for managing static assets in the Wallet WebApp.

## 1. Directory Structure

All static assets should be placed in the `src/assets` directory.

```
webapp/src/assets/
├── images/       # Static images (logos, backgrounds)
├── icons/        # SVG icons (if not using Lucide React)
├── fonts/        # Custom fonts
└── styles/       # Global styles (if not using Tailwind classes exclusively)
```

## 2. Version Control

All assets in `src/assets` are version-controlled via Git. 
- **Do not** commit large binary files (>10MB). Use external storage (S3/CDN) for large media.
- **Do** commit source SVGs and optimized PNGs/JPGs.

## 3. Asset Referencing in Code

### Imports (Recommended)
Import assets directly in your React components. This allows Vite to process, hash, and optimize them.

```typescript
import logo from '../assets/images/logo.png';

export const Header = () => (
  <img src={logo} alt="Wallet Logo" className="w-8 h-8" />
);
```

### Dynamic Assets
For dynamic assets (e.g., coin logos fetched from an API), ensure you have a fallback.

```typescript
<img 
  src={asset.logo_url} 
  onError={(e) => { e.currentTarget.src = fallbackImage; }} 
/>
```

## 4. Build Process & Optimization

We use Vite for building the application.

- **Command**: `npm run build`
- **Output**: `dist/` folder

Vite automatically:
- Hashes filenames for cache busting (e.g., `logo.2f9a1.png`).
- Minifies CSS and JS.
- Inlines small assets (base64) to reduce HTTP requests.

## 5. Cache Control

### Production (Vercel/Netlify)
If deploying to Vercel or similar platforms, cache headers are handled automatically for static assets (usually immutable, max-age=1yr).

### Custom Server (Express/Node)
If serving the `dist` folder via a Node.js server, use the following middleware configuration to ensure proper caching:

```javascript
// server.js example
const express = require('express');
const path = require('path');
const app = express();

const DIST_DIR = path.join(__dirname, 'dist');

// Serve static assets with long cache duration (1 year)
app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), {
  maxAge: '1y',
  immutable: true
}));

// Serve other files with short cache
app.use(express.static(DIST_DIR, {
  maxAge: '1h'
}));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(3000);
```

## 6. Troubleshooting

### "Receive" Page Loading Failure (Solved)
**Symptoms**: Page crashes or fails to load transaction history.
**Cause**: 
1. Mismatch between API response (`hash`, `amount` as string) and Frontend interface (`tx_hash`, `amount` as number).
2. `undefined` errors when filtering properties that don't exist.
**Solution**: 
- Updated Frontend interface to match API response.
- Added safe parsing for numeric values.
- Added Error Boundary to catch render errors.

### Asset 404s
- Verify the import path is correct relative to the file.
- Ensure the file exists in `src/assets`.
- If using absolute paths (e.g., `/images/logo.png`), ensure the file is in `public/`. **Note**: We recommend using `src/assets` and imports instead.

### Monitoring
- **Performance**: We use `web-vitals` to track LCP, CLS, FID. Check browser console or configured analytics endpoint.
- **Errors**: An `ErrorBoundary` wraps the application to catch and display runtime errors without crashing the entire app.
