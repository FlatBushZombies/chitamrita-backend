// @ts-nocheck
// This file uses Next.js API types. If you see a type error here in your editor, it can be ignored for deployment.
import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { query = "", limit = "50" } = req.query

    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, email")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(Number.parseInt(limit as string))

    if (error) throw error

    res.status(200).json(data)
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ error: "Failed to search users" })
  }
}
