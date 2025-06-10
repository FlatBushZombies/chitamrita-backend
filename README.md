# Chitamrita Backend

A Node.js/Express backend server optimized for React Native mobile applications with real-time messaging capabilities.

## Features

- 🚀 **Express.js Server**: Fast and lightweight REST API
- 🔐 **Clerk Authentication**: Secure user authentication and management
- 💾 **Supabase Database**: PostgreSQL database with real-time capabilities
- 🔌 **Socket.io**: Real-time messaging and notifications
- 🛡️ **Security**: Helmet, CORS, rate limiting
- 📱 **Mobile Optimized**: Designed specifically for React Native apps
- ☁️ **Vercel Ready**: Configured for serverless deployment

## API Endpoints

### Authentication
All protected endpoints require a Bearer token in the Authorization header.

### Users
- `GET /api/users/search?query=` - Search users by name/username
- `GET /api/users/:userId` - Get user details by ID
- `POST /api/users/batch` - Get multiple users by IDs

### Follow System
- `POST /api/follow` - Follow a user
- `DELETE /api/follow` - Unfollow a user
- `GET /api/follow/status?following_id=` - Check if following a user
- `GET /api/follow/following` - Get users you're following
- `GET /api/follow/followers` - Get your followers

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages/conversation?user_id=` - Get conversation with a user
- `GET /api/messages/last?user_id=` - Get last message with a user
- `GET /api/messages/conversations` - Get all conversations
- `POST /api/messages/mark-read` - Mark messages as read

### Real-time Events (Socket.io)
- `join` - Join user room for real-time updates
- `leave` - Leave user room
- `message` - Send real-time message
- `typing` - Send typing indicator
- `updateStatus` - Update online status

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Configure your `.env` file:
\`\`\`env
NODE_ENV=development
PORT=3000
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

4. Run database migrations:
Execute the SQL script in `scripts/create_tables.sql` in your Supabase dashboard.

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Deployment to Vercel

1. Install Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Deploy:
\`\`\`bash
vercel --prod
\`\`\`

3. Set environment variables in Vercel dashboard.

## Mobile App Integration

This backend is optimized for React Native apps with:

- **Token-based authentication** using Clerk
- **Real-time messaging** via Socket.io
- **Mobile-friendly API responses** with proper error handling
- **CORS configuration** for React Native development
- **Rate limiting** to prevent abuse
- **Comprehensive logging** for debugging

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate limiting**: Prevent API abuse
- **Input validation**: Sanitize user inputs
- **Authentication middleware**: Protect sensitive endpoints
- **Environment-based configuration**: Secure secrets management

## Database Schema

The backend uses PostgreSQL with the following main tables:

- `messages`: Store chat messages with metadata
- `follows`: User follow relationships
- `user_status`: Track online/offline status

See `scripts/create_tables.sql` for the complete schema.
