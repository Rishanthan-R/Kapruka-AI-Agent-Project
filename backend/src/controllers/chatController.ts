import { Request, Response } from 'express'
import OpenAI from 'openai'
import { config } from '../config/env'
import { McpService } from '../services/mcpService'

const mcpService = McpService.getInstance()

// Dynamically configure the AI client and model at startup based on config
let openai: OpenAI
let modelName: string

if (config.aiProvider === 'huggingface') {
  console.log(`🤖 AI Provider: Hugging Face (Model: ${config.huggingfaceModel})`)
  openai = new OpenAI({
    apiKey: config.hfToken || 'MOCK_KEY',
    baseURL: 'https://router.huggingface.co/v1'
  })
  modelName = config.huggingfaceModel
} else if (config.aiProvider === 'openai') {
  console.log(`🤖 AI Provider: OpenAI (Model: ${config.openaiModel})`)
  openai = new OpenAI({
    apiKey: config.openaiApiKey || 'MOCK_KEY'
  })
  modelName = config.openaiModel
} else {
  console.log(`🤖 AI Provider: Groq (Model: llama-3.3-70b-versatile)`)
  openai = new OpenAI({
    apiKey: config.groqApiKey || 'MOCK_KEY',
    baseURL: 'https://api.groq.com/openai/v1'
  })
  modelName = "llama-3.3-70b-versatile"
}

// Define tools in OpenAI / Groq tool specification format
const shoppingTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Search the live Kapruka product catalog. Returns real products with prices, images, and stock status. Use for queries like 'birthday cake', 'roses', 'tea gift set'.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search keywords (min 3 chars, e.g. 'ceylon tea', 'chocolate cake')" },
          category: { type: "string", description: "Optional category filter (e.g. 'Birthday', 'Flowers', 'Cakes')" }
        },
        required: ["q"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "browseCategories",
      description: "List all product categories available on Kapruka with their browse URLs. Use when the user wants to explore what's available.",
      parameters: {
        type: "object",
        properties: {
          depth: { type: "number", description: "Sub-category depth: 1 (top-level only) or 2 (with children). Default 1." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProduct",
      description: "Get full details for a single Kapruka product by its product ID. Returns name, description, price, stock, images, and URL.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "Kapruka product ID (e.g. 'cake00ka002034')" }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkDelivery",
      description: "Check whether Kapruka can deliver to a given Sri Lankan city today, and at what rate. Returns flat LKR delivery fee.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name in Sri Lanka (e.g. 'Colombo 03', 'Galle', 'Kandy')" },
          address: { type: "string", description: "Street address for the delivery" },
          district: { type: "string", description: "District name (e.g. 'Colombo', 'Southern')" }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listDeliveryCities",
      description: "Search or list Sri Lankan cities that Kapruka delivers to. Use to verify a city name before checking delivery.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Partial city name to search (e.g. 'colom', 'gal', 'kan')" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createOrder",
      description: "Create a guest-checkout order on Kapruka and return a click-to-pay link. No account required. The customer opens the link to pay.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Product ID from catalog" },
                quantity: { type: "number", description: "Quantity (default 1, max 99)" },
                icing_text: { type: "string", description: "Optional cake icing text" }
              },
              required: ["id"]
            }
          },
          recipientName: { type: "string", description: "Recipient full name" },
          recipientPhone: { type: "string", description: "Recipient contact number (e.g. +94771234567)" },
          deliveryAddress: { type: "string", description: "Delivery street address" },
          deliveryCity: { type: "string", description: "Delivery city (must be Kapruka-deliverable)" },
          senderName: { type: "string", description: "Sender name" },
          giftMessage: { type: "string", description: "Optional gift message (max 300 chars)" }
        },
        required: ["items", "recipientName", "recipientPhone", "deliveryAddress", "deliveryCity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trackOrder",
      description: "Track an existing Kapruka order by its order number. Returns status, delivery timeline, and progress.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "Kapruka order number (e.g. 'VIMP34456CB2')" }
        },
        required: ["orderNumber"]
      }
    }
  }
]

export const chatHandler = async (req: Request, res: Response) => {
  const { message, history, language } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required." })
  }

  // Check if API key exists for selected provider
  if (config.aiProvider === 'huggingface' && (!config.hfToken || config.hfToken === 'MOCK_KEY')) {
    return res.status(400).json({ error: "HF_TOKEN environment variable is not configured. Please add a valid Hugging Face Token in your .env file." })
  }
  if (config.aiProvider === 'openai' && (!config.openaiApiKey || config.openaiApiKey === 'YOUR_OPENAI_API_KEY_HERE' || config.openaiApiKey === 'MOCK_KEY')) {
    return res.status(400).json({ error: "OPENAI_API_KEY environment variable is not configured. Please add a valid OpenAI API key in your .env file." })
  }
  if (config.aiProvider === 'groq' && (!config.groqApiKey || config.groqApiKey === 'MOCK_KEY')) {
    return res.status(400).json({ error: "GROQ_API_KEY environment variable is not configured. Please add a valid Groq API key in your .env file." })
  }

  // System prompt defining the witty, helpful Sri Lankan Kapruka shopping assistant
  const systemPrompt = `You are a high-end, extremely helpful, warm, and witty conversational AI shopping assistant for Kapruka — Sri Lanka's largest e-commerce platform.
Your personality is friendly, local, and polite (using Sri Lankan hospitality terms like 'Ayubowan', 'Machan' if appropriate, and wishing them a great day).

Tool Call Guidelines:
- To search for products (e.g. cakes, watches, tea, flowers, toys, gifts), you MUST call "searchProducts" with singular keywords (e.g. 'watch' instead of 'watches', 'cake' instead of 'cakes'). Do not guess or fabricate product lists from your training data.
- To check delivery city availability or shipping rates to a Sri Lankan city, call "checkDelivery".
- To checkout or prepare a pay link for the cart, call "createOrder".
- To track an existing order, call "trackOrder".

Keep answers concise but visually rich. Present products attractively. Always show prices in LKR.
You support four languages: English (en), Sinhala (si), Tamil (ta), and Tanglish (tanglish - blended Sinhala/English/Tamil).
The user's current selected language is: '${language || 'en'}'. Adjust your responses to match this language mode seamlessly.`

  try {
    // Format chat history for OpenAI format
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...formatHistory(history, message)
    ]

    console.log("Full Messages Array:", JSON.stringify(messages, null, 2))
    console.log("Sending initial message to Groq Llama Agent:", message)

    const extractToolCalls = (message: any) => {
      let tcList = message.tool_calls ? [...message.tool_calls] : []
      if (tcList.length === 0 && message.content) {
        console.log("🔍 Fallback: Checking content for XML function tags:", message.content)
        const xmlRegex = /<function=(\w+)[>\s]*({.*?})[>\s]*<\/function>/g
        let match
        while ((match = xmlRegex.exec(message.content)) !== null) {
          console.log(`🎯 Found XML tool call in content: ${match[1]} with arguments: ${match[2]}`)
          tcList.push({
            id: `synthetic_${Math.random().toString(36).substr(2, 9)}`,
            type: 'function',
            function: {
              name: match[1],
              arguments: match[2]
            }
          } as any)
        }
        if (tcList.length > 0) {
          message.tool_calls = tcList
        }
      }
      return tcList
    }

    let completion
    let choice: any = null
    let toolCalls: any[] = []
    let messageObj: any = null

    try {
      completion = await openai.chat.completions.create({
        model: modelName,
        messages,
        tools: shoppingTools,
        tool_choice: "auto",
        max_tokens: config.aiMaxTokens,
        temperature: config.aiTemperature
      })
      choice = completion.choices[0]
      messageObj = choice.message
      toolCalls = extractToolCalls(messageObj)
    } catch (err: any) {
      console.warn("⚠️ Tool-calling request failed. Checking failed_generation in error...", err)
      const failedGen = err.error?.failed_generation || err.failed_generation
      if (failedGen) {
        console.log("🎯 Extracted failed_generation XML from error:", failedGen)
        messageObj = {
          role: 'assistant',
          content: failedGen
        }
        toolCalls = extractToolCalls(messageObj)
      }
      
      if (toolCalls.length === 0) {
        console.warn("⚠️ Bypassing tool calling. Attempting fallback call without tools...")
        try {
          require('fs').writeFileSync(
            "C:\\Users\\MSII\\.gemini\\antigravity-ide\\brain\\6f326881-a873-41f4-9d4f-6e9edd5fa271\\groq_debug.json",
            JSON.stringify({
              context: "inner_tool_call_failed",
              message: err.message,
              status: err.status,
              error: err.error || null,
              failed_generation: failedGen || null,
              stack: err.stack
            }, null, 2)
          )
        } catch (fsErr) {
          console.error("Failed to write debug log", fsErr)
        }
        completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          max_tokens: config.aiMaxTokens,
          temperature: config.aiTemperature
        })
        choice = completion.choices[0]
        messageObj = choice.message
        toolCalls = extractToolCalls(messageObj)
      }
    }

    let extraData: any = {}
    let loopCount = 0
    const maxLoops = 5

    // Multi-turn tool execution loop
    while (toolCalls && toolCalls.length > 0 && loopCount < maxLoops) {
      loopCount++
      // Add assistant response containing tool calls to history
      messages.push(messageObj)

      // Execute each tool call in this turn
      for (const toolCall of toolCalls) {
        const tc = toolCall as any
        const name = tc.function.name
        let args: any = {}
        try {
          args = JSON.parse(tc.function.arguments)
        } catch {
          console.warn("Failed to parse tool call arguments:", tc.function.arguments)
        }

        console.log(`[Loop ${loopCount}] Groq Llama called tool: ${name} with arguments:`, args)

        let functionResult: any = {}

        if (name === "searchProducts") {
          const searchQuery = args.q || args.query || ''
          const products = await mcpService.searchProducts(searchQuery, args.category)
          functionResult = { products }
          // Keep accumulating products or save latest
          extraData.products = products
        } else if (name === "browseCategories") {
          const result = await mcpService.browseCategories(args.depth || 1)
          functionResult = result
          extraData.categories = result.categories
        } else if (name === "getProduct") {
          const product = await mcpService.getProduct(args.productId)
          functionResult = product
        } else if (name === "checkDelivery") {
          const quote = await mcpService.quoteDelivery(args.address || '', args.city, args.district || '')
          functionResult = quote
          extraData.deliveryQuote = quote
        } else if (name === "listDeliveryCities") {
          const cities = await mcpService.listDeliveryCities(args.query)
          functionResult = cities
        } else if (name === "createOrder") {
          const checkout = await mcpService.createGuestCheckout(
            args.items,
            { name: args.recipientName, phone: args.recipientPhone },
            { address: args.deliveryAddress, city: args.deliveryCity },
            { name: args.senderName || args.recipientName },
            args.giftMessage
          )
          functionResult = checkout
          extraData.checkoutLink = checkout.checkoutLink
        } else if (name === "trackOrder") {
          const status = await mcpService.trackOrder(args.orderNumber)
          functionResult = status
          extraData.orderStatus = status
        }

        // Add function response to messages list
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(functionResult)
        })
      }

      // Query API again with tool outputs loaded (wrapped in safety try/catch)
      try {
        completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          tools: shoppingTools,
          max_tokens: config.aiMaxTokens,
          temperature: config.aiTemperature
        })
      } catch (err: any) {
        console.warn("⚠️ Secondary tool-calling request failed. Attempting fallback call without tools...", err)
        completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          max_tokens: config.aiMaxTokens,
          temperature: config.aiTemperature
        })
      }

      choice = completion.choices[0]
      messageObj = choice.message
      toolCalls = extractToolCalls(messageObj)
    }

    const replyText = messageObj.content || ""
    console.log("Extracted Groq Llama reply text:", replyText)

    return res.json({
      reply: replyText,
      ...extraData
    })

  } catch (error: any) {
    console.error("Error executing Chat Agent:", error)
    try {
      require('fs').writeFileSync(
        "C:\\Users\\MSII\\.gemini\\antigravity-ide\\brain\\6f326881-a873-41f4-9d4f-6e9edd5fa271\\groq_debug.json",
        JSON.stringify({
          message: error.message,
          status: error.status,
          error: error.error || null,
          failed_generation: error.error?.failed_generation || null,
          stack: error.stack
        }, null, 2)
      )
    } catch (fsErr) {
      console.error("Failed to write debug log", fsErr)
    }
    return res.status(500).json({ error: error.message || "An unexpected error occurred in the Groq AI engine." })
  }
}

// Format history array to match OpenAI Chat format
function formatHistory(history: any[], currentMsg: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const formatted: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  if (history && Array.isArray(history)) {
    history.forEach(h => {
      formatted.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })
    })
  }
  formatted.push({
    role: 'user',
    content: currentMsg
  })
  return formatted
}

// Trigger nodemon file watcher restart 6
