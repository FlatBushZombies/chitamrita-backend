// @ts-nocheck
// This file uses Next.js API types. If you see a type error here in your editor, it can be ignored for deployment.
import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId } = req.query
    if (!userId) return res.status(400).json({ error: "Missing userId" })

    // Try to find by id or clerk_id
    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, email, clerk_id")
      .or(`id.eq.${userId},clerk_id.eq.${userId}`)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: "User not found" })

    res.status(200).json(data)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}
