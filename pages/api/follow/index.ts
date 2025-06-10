import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Follow user
    const { follower_id, following_id } = req.body

    if (!follower_id || !following_id) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    try {
      const { error } = await supabase.from("follows").insert({ follower_id, following_id })

      if (error) throw error
      res.status(200).json({ success: true })
    } catch (error: any) {
      console.error("Error following user:", error)
      res.status(400).json({ error: error.message })
    }
  } else if (req.method === "DELETE") {
    // Unfollow user
    const { follower_id, following_id } = req.body

    if (!follower_id || !following_id) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    try {
      const { error } = await supabase.from("follows").delete().match({ follower_id, following_id })

      if (error) throw error
      res.status(200).json({ success: true })
    } catch (error: any) {
      console.error("Error unfollowing user:", error)
      res.status(400).json({ error: error.message })
    }
  } else {
    res.setHeader("Allow", ["POST", "DELETE"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
