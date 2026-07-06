// Entry shim: vite's root is `app/`, but the dev server can't resolve an
// index.html script src that points above the root (`../src/main.tsx`).
// This in-root shim keeps both `vite` (dev) and `vite build` happy.
import '../src/main';
