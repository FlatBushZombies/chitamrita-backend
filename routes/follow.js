const express = require("express")
const { supabase } = require("../config/database")
const { authenticateUser } = require("../middleware/auth")

const router = express.Router()

// Follow a user
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { following_id } = req.body
    const follower_id = req.userId

    if (!following_id) {
      return res.status(400).json({ error: "following_id is required" })
    }

    if (follower_id === following_id) {
      return res.status(400).json({ error: "Cannot follow yourself" })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", follower_id)
      .eq("following_id", following_id)
      .single()

    if (existingFollow) {
      return res.status(409).json({ error: "Already following this user" })
    }

    const { data, error } = await supabase.from("follows").insert({ follower_id, following_id }).select().single()

    if (error) throw error

    res.status(201).json({
      success: true,
      follow: data,
      message: "Successfully followed user",
    })
  } catch (error) {
    console.error("Error following user:", error)
    res.status(500).json({
      error: "Failed to follow user",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Unfollow a user
router.delete("/", authenticateUser, async (req, res) => {
  try {
    const { following_id } = req.body
    const follower_id = req.userId

    if (!following_id) {
      return res.status(400).json({ error: "following_id is required" })
    }

    const { data, error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", follower_id)
      .eq("following_id", following_id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Follow relationship not found" })
    }

    res.json({
      success: true,
      message: "Successfully unfollowed user",
    })
  } catch (error) {
    console.error("Error unfollowing user:", error)
    res.status(500).json({
      error: "Failed to unfollow user",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Check follow status
router.get("/status", authenticateUser, async (req, res) => {
  try {
    const { following_id } = req.query
    const follower_id = req.userId

    if (!following_id) {
      return res.status(400).json({ error: "following_id parameter is required" })
    }

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", follower_id)
      .eq("following_id", following_id)
      .single()

    if (error && error.code !== "PGRST116") throw error

    res.json({
      isFollowing: !!data,
      follower_id,
      following_id,
    })
  } catch (error) {
    console.error("Error checking follow status:", error)
    res.status(500).json({
      error: "Failed to check follow status",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get users that the current user is following
router.get("/following", authenticateUser, async (req, res) => {
  try {
    const follower_id = req.userId
    const { limit = "50", offset = "0" } = req.query

    const { data, error } = await supabase
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", follower_id)
      .order("created_at", { ascending: false })
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)

    if (error) throw error

    const followingIds = data.map((item) => item.following_id)

    res.json({
      following: followingIds,
      total: data.length,
      hasMore: data.length === Number.parseInt(limit),
    })
  } catch (error) {
    console.error("Error fetching following users:", error)
    res.status(500).json({
      error: "Failed to fetch following users",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get users that follow the current user
router.get("/followers", authenticateUser, async (req, res) => {
  try {
    const following_id = req.userId
    const { limit = "50", offset = "0" } = req.query

    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", following_id)
      .order("created_at", { ascending: false })
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)

    if (error) throw error

    const followerIds = data.map((item) => item.follower_id)

    res.json({
      followers: followerIds,
      total: data.length,
      hasMore: data.length === Number.parseInt(limit),
    })
  } catch (error) {
    console.error("Error fetching followers:", error)
    res.status(500).json({
      error: "Failed to fetch followers",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

module.exports = router
