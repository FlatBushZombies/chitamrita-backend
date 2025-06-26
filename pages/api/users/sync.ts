// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from "next"
import { clerk } from "../../../lib/clerk"
import { supabase } from "../../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        // Get Clerk user from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" })
        const token = authHeader.replace("Bearer ", "")
        const { userId } = await clerk.users.verifySession(token)
        if (!userId) return res.status(401).json({ error: "Invalid Clerk session" })

        // Fetch user info from Clerk
        const user = await clerk.users.getUser(userId)
        const email = user.emailAddresses[0]?.emailAddress || ""
        const username = user.username || email.split("@")[0]
        const full_name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || ""
        const avatar_url = user.imageUrl || ""

        // Check if user exists in Supabase
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single()

        let userRecord
        if (!existing) {
            // Insert new user
            const { data: inserted, error } = await supabase
                .from("users")
                .insert({
                    clerk_id: userId,
                    email,
                    username,
                    full_name,
                    avatar_url,
                })
                .select()
                .single()
            if (error) throw error
            userRecord = inserted
        } else {
            // Fetch full user record
            const { data } = await supabase
                .from("users")
                .select("id, clerk_id, email, username, full_name, avatar_url")
                .eq("clerk_id", userId)
                .single()
            userRecord = data
        }

        res.status(200).json(userRecord)
    } catch (error) {
        console.error("Error syncing user:", error)
        res.status(500).json({ error: "Failed to sync user" })
    }
} 