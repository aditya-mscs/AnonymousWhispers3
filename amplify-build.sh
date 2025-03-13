# Custom build script for Amplify

# Print environment for debugging (excluding secrets)
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install dependencies
echo "Installing dependencies..."
npm ci

# Copy environment variables
echo "Setting up environment variables..."
env | grep -e AWS_REGION -e SECRETS_TABLE -e COMMENTS_TABLE -e IP_HASH_SALT >> .env.production

# Build the application
echo "Building the application..."
npm run build

# Check build output
echo "Build completed. Output directory:"
ls -la .next/

exit 0

