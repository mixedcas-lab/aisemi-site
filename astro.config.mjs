import { defineConfig } from 'astro/config';

// All assets and internal links are relative, so the output works at any
// GitHub Pages repository path as well as a custom domain.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  site: process.env.SITE_URL || undefined,
  devToolbar: { enabled: false },
});
