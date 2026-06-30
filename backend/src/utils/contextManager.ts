import OpenAI from 'openai'

/**
 * Context Window Manager for the Kapruka AI Agent.
 *
 * Prevents context overflow by:
 * 1. Estimating token counts (1 token ≈ 4 chars)
 * 2. Applying a sliding window that keeps the most recent messages
 * 3. Summarizing older messages into a single condensed system note
 *
 * The system prompt and the latest user message are NEVER trimmed.
 */

const CHARS_PER_TOKEN = 4

/**
 * Estimate the token count of a single message.
 */
function estimateTokens(content: string): number {
  if (!content) return 0
  return Math.ceil(content.length / CHARS_PER_TOKEN) + 4 // +4 for role/metadata overhead
}

/**
 * Estimate total tokens across an array of messages.
 */
function estimateTotalTokens(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): number {
  return messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '')
    return sum + estimateTokens(content)
  }, 0)
}

/**
 * Summarize a batch of older messages into a single condensed note.
 * This is a fast, local summarization (no LLM call) to avoid extra API usage.
 */
function summarizeMessages(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): string {
  const points: string[] = []

  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : ''
    if (!content.trim()) continue

    if (msg.role === 'user') {
      // Extract the core intent from user messages
      const truncated = content.length > 100 ? content.substring(0, 100) + '...' : content
      points.push(`User asked: "${truncated}"`)
    } else if (msg.role === 'assistant') {
      // Extract key info from assistant replies
      const truncated = content.length > 150 ? content.substring(0, 150) + '...' : content
      points.push(`Assistant replied: "${truncated}"`)
    }
    // Skip tool messages in summary — they're verbose JSON
  }

  if (points.length === 0) return ''

  return `[Earlier conversation summary]\n${points.join('\n')}`
}

/**
 * Trim the message history to fit within a token budget.
 *
 * Strategy:
 * 1. Always keep: system prompt (index 0) + last user message (last element)
 * 2. Keep as many recent messages as possible within the budget
 * 3. If older messages had to be dropped, insert a summary of them
 *
 * @param messages - Full message array (system prompt + history + current user message)
 * @param maxTokens - Maximum token budget (e.g., 6000 out of 8192 model limit)
 * @returns Trimmed message array that fits within the budget
 */
export function trimHistory(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  maxTokens: number = 6000
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  // If already within budget, return as-is
  if (estimateTotalTokens(messages) <= maxTokens) {
    return messages
  }

  // Separate the fixed parts
  const systemMsg = messages[0] // System prompt — always kept
  const currentUserMsg = messages[messages.length - 1] // Current user message — always kept
  const middleMessages = messages.slice(1, -1) // Everything in between

  // Calculate token budget remaining after fixed messages
  const fixedTokens = estimateTokens(typeof systemMsg.content === 'string' ? systemMsg.content : '') +
                      estimateTokens(typeof currentUserMsg.content === 'string' ? currentUserMsg.content : '')
  let availableTokens = maxTokens - fixedTokens - 200 // 200 token buffer for summary

  if (availableTokens <= 0) {
    // Even system + current message exceeds budget — just return those
    console.warn('⚠️ Context trimmer: system prompt + current message alone exceeds token budget')
    return [systemMsg, currentUserMsg]
  }

  // Walk backwards through middle messages, keeping as many recent ones as possible
  const keptMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  let tokenCount = 0

  for (let i = middleMessages.length - 1; i >= 0; i--) {
    const msg = middleMessages[i]
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '')
    const msgTokens = estimateTokens(content)

    if (tokenCount + msgTokens <= availableTokens) {
      keptMessages.unshift(msg) // Add to front to maintain order
      tokenCount += msgTokens
    } else {
      // Remaining older messages get summarized
      const droppedMessages = middleMessages.slice(0, i + 1)
      const summary = summarizeMessages(droppedMessages)

      if (summary) {
        const summaryMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
          role: 'system',
          content: summary
        }
        keptMessages.unshift(summaryMsg)
      }

      console.log(`📋 Context trimmer: Summarized ${droppedMessages.length} older messages, kept ${keptMessages.length} recent messages`)
      break
    }
  }

  return [systemMsg, ...keptMessages, currentUserMsg]
}
