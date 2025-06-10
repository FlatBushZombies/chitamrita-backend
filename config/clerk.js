const { createClerkClient } = require('@clerk/backend')

const clerkSecretKey = process.env.CLERK_SECRET_KEY

if (!clerkSecretKey) {
  throw new Error("Missing Clerk secret key. Please check your environment variables.")
}

if (!clerkSecretKey.startsWith('sk_')) {
  throw new Error("Invalid Clerk secret key format. It should start with 'sk_'")
}

const clerk = createClerkClient({
  secretKey: clerkSecretKey,
  apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
  apiVersion: process.env.CLERK_API_VERSION || 'v1'
})

// Test the connection
clerk.users.getUserList()
  .then(() => console.log('Clerk connection successful'))
  .catch((error) => {
    console.error('Clerk connection failed:', error.message)
    process.exit(1)
  })

module.exports = { clerk }
