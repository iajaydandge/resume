# Resume Tailoring Web Client

A modern, responsive React Single-Page Application (SPA) built with Vite, TypeScript, Tailwind CSS v4, and shadcn/ui.

---

## 📦 Installed Frontend Packages & References

| Package | Version | Purpose | Documentation Reference |
| :--- | :--- | :--- | :--- |
| **`react` & `react-dom`** | `^19.2.8` | Declarative UI framework | [React Official Docs](https://react.dev/) |
| **`react-router`** | `^8.3.0` | Declarative client-side routing & navigation | [React Router Docs](https://reactrouter.com/) |
| **`vite`** | `^8.2.0` | Next-generation frontend bundler & dev server | [Vite Getting Started](https://vite.dev/guide/) |
| **`tailwindcss`** | `^4.3.3` | Utility-first CSS framework (v4 CSS-first engine) | [Tailwind CSS v4 Vite Guide](https://tailwindcss.com/docs/installation/framework-guides/vite) |
| **`@tailwindcss/vite`** | `^4.3.3` | Official Vite plugin for Tailwind CSS v4 | [Tailwind CSS v4 Vite Setup](https://tailwindcss.com/docs/guides/vite) |
| **`shadcn`** | `^4.16.2` | Component system initialized with preset `bcixmAF6` (Nova Zinc theme) | [shadcn/ui Vite Setup](https://ui.shadcn.com/docs/installation/vite#existing-project) & [Preset bcixmAF6](https://ui.shadcn.com/create?preset=bcixmAF6) |
| **`@base-ui/react`** | `^1.7.0` | Accessible unstyled primitives powering shadcn components | [Base UI Docs](https://base-ui.com/) |
| **`@fontsource-variable/geist`** | `^5.3.0` | Modern, clean typography by Vercel | [Geist Font](https://vercel.com/font) |
| **`lucide-react`** | `^1.31.0` | Beautiful, consistent icons for UI elements | [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react) |
| **`clsx`** | `^2.1.1` | Constructing `className` strings conditionally | [clsx GitHub](https://github.com/lukeed/clsx) |
| **`tailwind-merge`** | `^3.6.0` | Efficiently merges Tailwind CSS classes without conflict | [tailwind-merge GitHub](https://github.com/dcastil/tailwind-merge) |
| **`class-variance-authority`**| `^0.7.1` | Variant-based styling configuration for reusable UI components | [CVA Docs](https://cva.style/docs) |
| **`tw-animate-css`** | `^1.4.0` | Smooth transition and layout micro-animations | [shadcn Animation](https://ui.shadcn.com/) |
| **`@tanstack/react-query`** | `^5.101.4` | Asynchronous server state caching, queries, and mutations lifecycle | [TanStack Query Docs](https://tanstack.com/query/latest) |
| **`@tanstack/react-query-devtools`** | `^5.101.4` | Interactive debugging panel for cached server queries and mutations | [React Query Devtools Docs](https://tanstack.com/query/latest/docs/framework/react/devtools) |
| **`zustand`** | `^5.0.3` | Lightweight state store for local client UI tab focus and modal states | [Zustand Guide](https://zustand.docs.pmnd.rs/getting-started/introduction) |

---

## 🎨 shadcn/ui Configuration

Configured via `components.json`:
* **Preset:** `bcixmAF6`
* **Style:** `base-nova`
* **Base Color:** `zinc`
* **CSS:** `src/index.css`
* **Path Aliases:**
  * Components: `@/components`
  * UI Primitives: `@/components/ui`
  * Utilities: `@/lib/utils`
  * Lib: `@/lib`
  * Hooks: `@/hooks`

---

## 🚀 Running the Client Locally

```bash
# Start Vite development server
bun run dev

# Build for production (outputs to dist/)
bun run build
```
