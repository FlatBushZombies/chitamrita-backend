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
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    if (userId === following_id) {
      return res.status(400).json({ error: "Cannot follow yourself" })
    }
    try {
      // Check if already following
      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", following_id)
        .single()
      if (existing) {
        return res.status(409).json({ error: "Already following this user" })
      }
      const { data, error } = await supabase
        .from("follows")
        .insert({ follower_id: userId, following_id })
        .select()
        .single()
      if (error) throw error
      res.status(201).json({ success: true, follow: data })
    } catch (error: any) {
      console.error("Error following user:", error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === "GET") {
    // Get users the authenticated user is following
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id, following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
      if (error) throw error
      res.status(200).json({ following: data })
    } catch (error: any) {
      console.error("Error fetching following:", error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
