/** @type {import('next').NextConfig} */
const nextConfig = {
  // The "@/*" alias comes from tsconfig.json paths, which Next resolves
  // natively — no bundler config needed.

  // Don't let the dev server write AGENTS.md/CLAUDE.md into the repo.
  agentRules: false,
};

export default nextConfig;
