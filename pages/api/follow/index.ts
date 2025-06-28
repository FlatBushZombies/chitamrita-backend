import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"
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

// Helper to validate Clerk user ID format
function isValidClerkUserId(userId: string): boolean {
  // Clerk user IDs are typically alphanumeric and can contain underscores
  return /^[a-zA-Z0-9_]+$/.test(userId) && userId.length > 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for frontend integration
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing token" })
  }

  if (req.method === "POST") {
    // Follow user
    const { following_id } = req.body

    if (!following_id) {
      return res.status(400).json({ error: "Missing following_id in request body" })
    }

    if (!isValidClerkUserId(following_id)) {
      return res.status(400).json({ error: "Invalid following_id format" })
    }

    if (userId === following_id) {
      return res.status(400).json({ error: "Cannot follow yourself" })
    }

    try {
      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", following_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        return res.status(409).json({ error: "Already following this user" })
      }

      // Insert the follow relationship
      const { data, error } = await supabase
        .from("follows")
        .insert({
          follower_id: userId,
          following_id
        })
        .select("id, follower_id, following_id, created_at")
        .single()

      if (error) {
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
          return res.status(409).json({ error: "Already following this user" })
        }
        throw error
      }

      console.log(`User ${userId} followed user ${following_id}`)
      res.status(201).json({
        success: true,
        follow: data,
        message: "Successfully followed user"
      })
    } catch (error: any) {
      console.error("Error following user:", error)
      res.status(500).json({
        error: "Failed to follow user",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  } else if (req.method === "GET") {
    // Get users the authenticated user is following
    try {
      const { limit = "50", offset = "0" } = req.query
      const limitNum = Math.min(parseInt(limit as string) || 50, 100) // Max 100
      const offsetNum = parseInt(offset as string) || 0

      const { data, error } = await supabase
        .from("follows")
        .select("id, following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1)

      if (error) throw error

      res.status(200).json({
        following: data || [],
        total: data?.length || 0,
        hasMore: (data?.length || 0) === limitNum,
        follower_id: userId
      })
    } catch (error: any) {
      console.error("Error fetching following:", error)
      res.status(500).json({
        error: "Failed to fetch following list",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  } else {
    res.setHeader("Allow", ["POST", "GET", "OPTIONS"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
