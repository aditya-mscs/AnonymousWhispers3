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
}

export default nextConfig

