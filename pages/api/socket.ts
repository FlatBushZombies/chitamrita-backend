import type { NextApiRequest } from "next"
import { Server as ServerIO } from "socket.io"
import type { NextApiResponseServerIO } from "../../types/socket"

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new ServerIO(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join", (userId: string) => {
        socket.join(userId)
        console.log(`User ${userId} joined room`)
      })

      socket.on("leave", (userId: string) => {
        socket.leave(userId)
        console.log(`User ${userId} left room`)
      })

      socket.on("message", ({ receiverId, message }) => {
        socket.to(receiverId).emit("newMessage", message)
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })
  }
  res.end()
}
