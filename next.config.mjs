const nextConfig = {
  // Remove swcMinify as it's enabled by default in Next.js 15
  
  // Update serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-sts',
  ],
  
  experimental: {
    // Remove serverComponentsExternalPackages from experimental
    // Other experimental features can stay
    authInterrupts: true,
  },
}

export default nextConfig

