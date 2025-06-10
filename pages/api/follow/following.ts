import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id parameter" })
    }

    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user_id as string)

    if (error) throw error

    const followingIds = data.map((item) => item.following_id)
    res.status(200).json(followingIds)
  } catch (error: any) {
    console.error("Error fetching following users:", error)
    res.status(400).json({ error: error.message })
  }
}
