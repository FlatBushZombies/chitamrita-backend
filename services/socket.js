const connectedUsers = new Map()

const initializeSocket = (io) => {
  // Store io instance for use in routes
  io.app = { io }

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`)

    // Handle user joining
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId)
        connectedUsers.set(userId, socket.id)
        console.log(` User ${userId} joined room`)

        // Notify user they're connected
        socket.emit("connected", { userId, socketId: socket.id })
      }
    })

    // Handle user leaving
    socket.on("leave", (userId) => {
      if (userId) {
        socket.leave(userId)
        connectedUsers.delete(userId)
        console.log(`User ${userId} left room`)
      }
    })

    // Handle sending messages
    socket.on("message", ({ receiverId, message }) => {
      if (receiverId && message) {
        // Send to specific user
        socket.to(receiverId).emit("newMessage", message)
        console.log(` Message sent from ${socket.id} to ${receiverId}`)
      }
    })

    // Handle typing indicators
    socket.on("typing", ({ receiverId, isTyping, senderId }) => {
      if (receiverId) {
        socket.to(receiverId).emit("userTyping", {
          senderId,
          isTyping,
          timestamp: new Date().toISOString(),
        })
      }
    })

    // Handle user status updates
    socket.on("updateStatus", ({ userId, status }) => {
      if (userId && ["online", "away", "busy"].includes(status)) {
        socket.broadcast.emit("userStatusUpdate", { userId, status })
      }
    })

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(` User disconnected: ${socket.id}, reason: ${reason}`)

      // Remove from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId)
          // Notify others that user went offline
          socket.broadcast.emit("userStatusUpdate", {
            userId,
            status: "offline",
            lastSeen: new Date().toISOString(),
          })
          break
        }
      }
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(` Socket error for ${socket.id}:`, error)
    })
  })

  // Periodic cleanup of stale connections
  setInterval(() => {
    const connectedCount = connectedUsers.size
    const socketCount = io.engine.clientsCount

    if (connectedCount !== socketCount) {
      console.log(`🧹 Cleaning up connections. Mapped: ${connectedCount}, Actual: ${socketCount}`)
    }
  }, 60000) // Every minute

  console.log(" Socket.io initialized successfully")
}

const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys())
}

const isUserOnline = (userId) => {
  return connectedUsers.has(userId)
}

const sendToUser = (io, userId, event, data) => {
  io.to(userId).emit(event, data)
}

module.exports = {
  initializeSocket,
  getConnectedUsers,
  isUserOnline,
  sendToUser,
}
