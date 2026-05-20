// next.config.mjs
// Note: next.config.ts is only supported in Next.js 15+.
// Using .mjs with JSDoc types for Next.js 14 compatibility.
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
}

export default nextConfig
