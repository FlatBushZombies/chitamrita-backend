import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { user1, user2 } = req.query

    if (!user1 || !user2) {
      return res.status(400).json({ error: "Missing user parameters" })
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") throw error

    res.status(200).json(data || null)
  } catch (error: any) {
    console.error("Error fetching last message:", error)
    res.status(500).json({ error: error.message })
  }
}
