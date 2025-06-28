import type { NextApiRequest, NextApiResponse } from "next"
import { clerk } from "../../../lib/clerk"

// Helper to get user from Clerk token
async function getUserIdFromRequest(req: NextApiRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null
    const token = authHeader.substring(7)
    try {
        const session = await clerk.users.verifySession(token)
        return session.userId
    } catch (e) {
        console.error("Token verification failed:", e)
        return null
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set CORS headers for frontend integration
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET", "OPTIONS"])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    // Optional authentication - if token provided, verify it
    const userId = await getUserIdFromRequest(req)

    try {
        const {
            limit = "10",
            offset = "0",
            emailAddress = "",
            username = "",
            search = ""
        } = req.query

        const limitNum = Math.min(parseInt(limit as string) || 10, 50) // Max 50 users per request
        const offsetNum = parseInt(offset as string) || 0

        // Build search parameters
        const searchParams: any = {
            limit: limitNum,
            offset: offsetNum,
        }

        // Add search filters if provided
        if (emailAddress) {
            searchParams.emailAddress = emailAddress as string
        }
        if (username) {
            searchParams.username = username as string
        }
        if (search) {
            searchParams.query = search as string
        }

        // Fetch users from Clerk
        const users = await clerk.users.getUserList(searchParams)

        // Transform the data to be more frontend-friendly
        const transformedUsers = users.data.map(user => ({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
            username: user.username || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            fullName: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.lastName || "",
            imageUrl: user.imageUrl || "",
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
            publicMetadata: user.publicMetadata || {},
            privateMetadata: user.privateMetadata || {},
            unsafeMetadata: user.unsafeMetadata || {}
        }))

        res.status(200).json({
            users: transformedUsers,
            total: users.totalCount || 0,
            hasMore: (offsetNum + limitNum) < (users.totalCount || 0),
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                total: users.totalCount || 0
            }
        })

    } catch (error: any) {
        console.error("Error fetching Clerk users:", error)
        res.status(500).json({
            error: "Failed to fetch users",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
} 