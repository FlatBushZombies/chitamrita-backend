const { clerk } = require("../config/clerk")

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No valid authorization token provided" })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const session = await clerk.verifyToken(token)
      req.userId = session.sub
      req.user = session
      next()
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError)
      return res.status(401).json({ error: "Invalid or expired token" })
    }
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ error: "Authentication service error" })
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const session = await clerk.verifyToken(token)
        req.userId = session.sub
        req.user = session
      } catch (tokenError) {
        // Token is invalid but we continue without authentication
        console.warn("Optional auth failed:", tokenError.message)
      }
    }

    next()
  } catch (error) {
    console.error("Optional authentication error:", error)
    next() // Continue without authentication
  }
}

module.exports = { authenticateUser, optionalAuth }
