const express = require("express")
const { clerk } = require("../config/clerk")
const { optionalAuth } = require("../middleware/auth")

const router = express.Router()

// Search users
router.get("/search", optionalAuth, async (req, res) => {
  try {
    const { query = "", limit = "50" } = req.query

    const response = await clerk.users.getUserList({
      query: query,
      limit: Math.min(Number.parseInt(limit), 100), // Cap at 100 users
    })

    // Ensure we have an array of users
    const users = Array.isArray(response) ? response : response?.data || []

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      username: user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
      email: user.emailAddresses[0]?.emailAddress || "",
      createdAt: user.createdAt,
    }))

    res.json({
      users: formattedUsers,
      total: formattedUsers.length,
      query: query,
    })
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({
      error: "Failed to search users",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get user by ID
router.get("/:userId", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" })
    }

    const user = await clerk.users.getUser(userId)

    const formattedUser = {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      username: user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
      email: user.emailAddresses[0]?.emailAddress || "",
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }

    res.json(formattedUser)
  } catch (error) {
    console.error("Error fetching user:", error)

    if (error.status === 404) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(500).json({
      error: "Failed to fetch user",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get multiple users by IDs
router.post("/batch", optionalAuth, async (req, res) => {
  try {
    const { userIds } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "User IDs array is required" })
    }

    if (userIds.length > 50) {
      return res.status(400).json({ error: "Maximum 50 user IDs allowed per request" })
    }

    const users = await Promise.allSettled(userIds.map((userId) => clerk.users.getUser(userId)))

    const formattedUsers = users
      .filter((result) => result.status === "fulfilled")
      .map((result) => {
        const user = result.value
        return {
          id: user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          imageUrl: user.imageUrl || "",
          username: user.username || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
          email: user.emailAddresses[0]?.emailAddress || "",
        }
      })

    res.json({
      users: formattedUsers,
      requested: userIds.length,
      found: formattedUsers.length,
    })
  } catch (error) {
    console.error("Error fetching users batch:", error)
    res.status(500).json({
      error: "Failed to fetch users",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

module.exports = router
