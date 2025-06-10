import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { sender_id, receiver_id, content, message_type = "text" } = req.body

    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id,
        receiver_id,
        content,
        message_type,
      })
      .select()
      .single()

    if (error) throw error

    res.status(200).json(data)
  } catch (error: any) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: error.message })
  }
}
