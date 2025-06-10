import type { NextApiRequest, NextApiResponse } from "next"
import { clerk } from "../../../lib/clerk"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { userId } = req.query

    const user = await clerk.users.getUser(userId as string)

    const formattedUser = {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      username: user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
      email: user.emailAddresses[0]?.emailAddress || "",
    }

    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}
