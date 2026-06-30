import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { chatHandler, streamChatHandler } from '../controllers/chatController'

const router = Router()

// Rate limiter: max 20 chat requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 20,                    // 20 requests per window per IP
  standardHeaders: true,      // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,       // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests. Please wait a moment before sending another message.',
    retryAfterSeconds: 60
  }
})

router.post('/chat', chatLimiter, chatHandler)
router.post('/chat/stream', chatLimiter, streamChatHandler)

export default router
