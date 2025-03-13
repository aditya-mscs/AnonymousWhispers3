const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placeholder.com'],
  },
  // Configure for AWS Amplify deployment
  output: 'standalone',
  // Enable AWS Lambda integration for API routes
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk'],
  },
  // Disable ESLint during build (we'll run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build (we'll run it separately)
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig

