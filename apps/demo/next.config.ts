import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'zod-utils';

const nextConfig: NextConfig = {
  reactCompiler: false, // shadcn/ui form doesn't show errors during submit if reactCompiler is true
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
  // Compile workspace packages from TypeScript source without building
  transpilePackages: ['@zod-utils/core', '@zod-utils/react-hook-form'],
};

export default nextConfig;
