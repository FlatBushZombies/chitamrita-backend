// @ts-nocheck
// This file uses Next.js API types. If you see a type error here in your editor, it can be ignored for deployment.
import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { sender_id, receiver_id, content } = req.body

    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id,
        receiver_id,
        content,
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Emit Socket.io event to receiver here if possible

    res.status(200).json(data)
  } catch (error: any) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: error.message })
  }
}
