import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { follower_id, following_id } = req.query

    if (!follower_id || !following_id) {
      return res.status(400).json({ error: "Missing required parameters" })
    }

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .match({
        follower_id: follower_id as string,
        following_id: following_id as string,
      })
      .single()

    if (error && error.code !== "PGRST116") throw error

    res.status(200).json({ isFollowing: !!data })
  } catch (error: any) {
    console.error("Error checking follow status:", error)
    res.status(400).json({ error: error.message })
  }
}
