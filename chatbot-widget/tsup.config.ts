import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  // esm/cjs for npm/bundler consumers, iife (global `ChatbotWidget`) for a
  // plain <script src="..."> tag on any website (WordPress, static HTML, etc).
  format: ['esm', 'cjs', 'iife'],
  globalName: 'ChatbotWidget',
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'es2018',
});
