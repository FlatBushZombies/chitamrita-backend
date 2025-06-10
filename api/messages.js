const express = require("express")
const { supabase } = require("../config/database")
const { authenticateUser } = require("../middleware/auth")

const router = express.Router()

// Send a message
router.post("/send", authenticateUser, async (req, res) => {
  try {
    const { receiver_id, content, message_type = "text" } = req.body
    const sender_id = req.userId

    if (!receiver_id || !content) {
      return res.status(400).json({ error: "receiver_id and content are required" })
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: "Message content too long (max 1000 characters)" })
    }

    if (!["text", "voice", "image"].includes(message_type)) {
      return res.status(400).json({ error: "Invalid message type" })
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

    // Emit real-time message via Socket.io
    const io = req.app.get("io")
    if (io) {
      io.to(receiver_id).emit("newMessage", data)
    }

    res.status(201).json({
      success: true,
      message: data,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({
      error: "Failed to send message",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get conversation messages between two users
router.get("/conversation", authenticateUser, async (req, res) => {
  try {
    const { user_id, limit = "50", offset = "0", before } = req.query
    const current_user_id = req.userId

    if (!user_id) {
      return res.status(400).json({ error: "user_id parameter is required" })
    }

    let query = supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${current_user_id},receiver_id.eq.${user_id}),and(sender_id.eq.${user_id},receiver_id.eq.${current_user_id})`,
      )
      .order("created_at", { ascending: false })
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)

    // Add before filter for pagination
    if (before) {
      query = query.lt("created_at", before)
    }

    const { data, error } = await query

    if (error) throw error

    // Reverse to show oldest first
    const messages = data.reverse()

    res.json({
      messages,
      total: data.length,
      hasMore: data.length === Number.parseInt(limit),
      conversation: {
        user1: current_user_id,
        user2: user_id,
      },
    })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    res.status(500).json({
      error: "Failed to fetch conversation",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get last message between two users
router.get("/last", authenticateUser, async (req, res) => {
  try {
    const { user_id } = req.query
    const current_user_id = req.userId

    if (!user_id) {
      return res.status(400).json({ error: "user_id parameter is required" })
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${current_user_id},receiver_id.eq.${user_id}),and(sender_id.eq.${user_id},receiver_id.eq.${current_user_id})`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") throw error

    res.json({
      lastMessage: data || null,
      conversation: {
        user1: current_user_id,
        user2: user_id,
      },
    })
  } catch (error) {
    console.error("Error fetching last message:", error)
    res.status(500).json({
      error: "Failed to fetch last message",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Get all conversations for the current user
router.get("/conversations", authenticateUser, async (req, res) => {
  try {
    const user_id = req.userId
    const { limit = "20" } = req.query

    // Get latest message for each conversation
    const { data, error } = await supabase.rpc("get_user_conversations", {
      user_id: user_id,
      conversation_limit: Number.parseInt(limit),
    })

    if (error) throw error

    res.json({
      conversations: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    res.status(500).json({
      error: "Failed to fetch conversations",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

// Mark messages as read
router.post("/mark-read", authenticateUser, async (req, res) => {
  try {
    const { sender_id } = req.body
    const receiver_id = req.userId

    if (!sender_id) {
      return res.status(400).json({ error: "sender_id is required" })
    }

    const { data, error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", sender_id)
      .eq("receiver_id", receiver_id)
      .is("read_at", null)
      .select()

    if (error) throw error

    res.json({
      success: true,
      markedAsRead: data?.length || 0,
    })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    res.status(500).json({
      error: "Failed to mark messages as read",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
    })
  }
})

module.exports = router
