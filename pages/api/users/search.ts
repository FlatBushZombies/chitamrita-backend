import type { NextApiRequest, NextApiResponse } from "next"
import { clerk } from "../../../lib/clerk"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { query = "", limit = "50" } = req.query

    const users = await clerk.users.getUserList({
      query: query as string,
      limit: Number.parseInt(limit as string),
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      username: user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
      email: user.emailAddresses[0]?.emailAddress || "",
    }))

    res.status(200).json(formattedUsers)
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ error: "Failed to search users" })
  }
}
