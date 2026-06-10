import { Request, Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config/env'
import { McpService } from '../services/mcpService'

const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'MOCK_KEY')
const mcpService = McpService.getInstance()

// Define function declarations for Gemini tool calling
const shoppingTools: any = {
  functionDeclarations: [
    {
      name: "searchProducts",
      description: "Search the live Kapruka product catalog with search queries. Keywords can include 'tea', 'cake', 'roses', 'sweets'.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "Catalog search keywords (e.g. 'ceylon tea', 'chocolate cake')" }
        },
        required: ["query"]
      }
    },
    {
      name: "quoteDelivery",
      description: "Calculates shipping cost and delivery timelines for Sri Lankan shipping addresses.",
      parameters: {
        type: "OBJECT",
        properties: {
          address: { type: "STRING", description: "Street address details" },
          city: { type: "STRING", description: "City name in Sri Lanka (e.g. 'Colombo', 'Galle', 'Kandy')" },
          district: { type: "STRING", description: "District name in Sri Lanka (e.g. 'Colombo', 'Galle', 'Kandy')" }
        },
        required: ["address", "city", "district"]
      }
    },
    {
      name: "createGuestCheckout",
      description: "Generates guest order payloads and compiles a secure guest checkout payment link (pay link).",
      parameters: {
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING", description: "Product catalog ID" },
                quantity: { type: "NUMBER", description: "Quantity of product" },
                giftWrap: { type: "BOOLEAN", description: "Is gift-wrapped" },
                giftMessage: { type: "STRING", description: "Personalized greeting message" }
              },
              required: ["id", "quantity"]
            }
          },
          recipientDetails: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Recipient name" },
              phone: { type: "STRING", description: "Recipient contact number" }
            },
            required: ["name", "phone"]
          }
        },
        required: ["items", "recipientDetails"]
      }
    },
    {
      name: "trackOrder",
      description: "Queries the tracking status of an existing Kapruka order using an order ID.",
      parameters: {
        type: "OBJECT",
        properties: {
          orderId: { type: "STRING", description: "The order ID starting with KAP- (e.g., KAP-123456)" }
        },
        required: ["orderId"]
      }
    }
  ]
}

export const chatHandler = async (req: Request, res: Response) => {
  const { message, history, language } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required." })
  }

  // System prompt defining the witty, helpful Sri Lankan Kapruka shopping assistant
  const systemPrompt = `You are a high-end, extremely helpful, warm, and witty conversational AI shopping assistant for Kapruka.
Your personality is friendly, local, and polite (using local hospitality terms like 'Ayubowan', 'Machan' if appropriate, and wishing them a great day).
You MUST help users find products, calculate delivery rates, wrap gifts, and checkout.
Keep answers concise. Always intercept intents and call matching tools when appropriate.
You support four languages: English (en), Sinhala (si), Tamil (ta), and Tanglish (tanglish - blended Sinhala/English/Tamil).
The user's current selected language is: '${language || 'en'}'. Adjust your responses to match this language mode seamlessly.`

  // Check if Gemini API key exists, otherwise run simulation fallback directly
  if (!config.geminiApiKey || config.geminiApiKey === 'MOCK_KEY') {
    return runSimulationResponse(message, language, res)
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // standard model for fast tool calls
      systemInstruction: systemPrompt,
    })

    // Format chat history for Gemini API
    const contents = formatHistory(history, message)

    // Call Gemini with tools
    let result = await model.generateContent({
      contents,
      tools: [shoppingTools]
    })

    let response = result.response
    const functionCalls = response.functionCalls()

    let extraData: any = {}

    if (functionCalls && functionCalls.length > 0) {
      const toolCall = functionCalls[0]
      const name = toolCall.name
      const args: any = toolCall.args

      console.log(`Gemini called function tool: ${name} with arguments:`, args)

      let functionResult: any = {}

      if (name === "searchProducts") {
        const products = await mcpService.searchProducts(args.query)
        functionResult = { products }
        extraData.products = products
      } else if (name === "quoteDelivery") {
        const quote = await mcpService.quoteDelivery(args.address, args.city, args.district)
        functionResult = quote
        extraData.deliveryQuote = quote
      } else if (name === "createGuestCheckout") {
        const checkout = await mcpService.createGuestCheckout(args.items, args.recipientDetails)
        functionResult = checkout
        extraData.checkoutLink = checkout.checkoutLink
      } else if (name === "trackOrder") {
        const status = await mcpService.trackOrder(args.orderId)
        functionResult = status
        extraData.orderStatus = status
      }

      // Add tool output back into history for Gemini to formulate text response
      contents.push({ role: 'model', parts: [response.candidates![0].content.parts[0]] })
      contents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name,
            response: functionResult
          }
        }]
      })

      // Get final conversational text incorporating the tool data
      const finalResult = await model.generateContent({ contents })
      response = finalResult.response
    }

    const replyText = response.text()
    return res.json({
      reply: replyText,
      ...extraData
    })

  } catch (error) {
    console.error("Error calling Gemini API, falling back to simulated engine:", error)
    return runSimulationResponse(message, language, res)
  }
}

// Format history to match Gemini's structure
function formatHistory(history: any[], currentMsg: string): any[] {
  const formatted: any[] = []
  if (history && Array.isArray(history)) {
    history.forEach(h => {
      formatted.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })
    })
  }
  formatted.push({
    role: 'user',
    parts: [{ text: currentMsg }]
  })
  return formatted
}

// Fallback Simulation response if Gemini API key is missing or calls fail
function runSimulationResponse(message: string, language: string, res: Response) {
  const query = message.toLowerCase()
  let reply = ""
  let products: any[] | undefined = undefined
  let deliveryQuote: any = undefined
  let checkoutLink: string | undefined = undefined
  let orderStatus: any = undefined

  const matchesSearch = query.includes("search") || query.includes("find") || query.includes("සොයන්න") || query.includes("തേடு") || query.includes("cake") || query.includes("tea") || query.includes("rose") || query.includes("sweet") || query.includes("chocolate")
  const matchesDelivery = query.includes("delivery") || query.includes("charge") || query.includes("galle") || query.includes("colombo") || query.includes("kandy") || query.includes("ඩිලිවරි") || query.includes("ගාස්තු") || query.includes("விநியோகம்")
  const matchesCheckout = query.includes("checkout") || query.includes("pay") || query.includes("buy") || query.includes("ගෙවන්න") || query.includes("මිලදී") || query.includes("கட்டணம்")

  if (matchesSearch) {
    // Filter sample products
    products = [
      {
        id: "p1",
        title: "Premium Ceylon Black Tea Gift Set",
        price: 3850,
        imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
        description: "Finest quality single-origin Ceylon tea in a hand-crafted wooden presentation box.",
        availability: true
      },
      {
        id: "p2",
        title: "Deluxe Chocolate Fudge Cake (1kg)",
        price: 4500,
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
        description: "Rich, moist layers of chocolate sponge smothered in premium dark chocolate icing.",
        availability: true
      }
    ]
    if (language === 'si') {
      reply = "මම ඔබේ සෙවුමට ගැලපෙන කප්රුක භාණ්ඩ සොයා ගත්තා. ඔබට අවශ්‍ය දේ තෝරා කරත්තයට එක් කර ගන්න."
    } else if (language === 'tanglish') {
      reply = "මම ඔයාට ගැලපෙන products කිහිපයක් සෙට් කලා. මෙතනින් කැමති එකක් select කරලා Cart එකට Add කරගන්න!"
    } else {
      reply = "I found these live products in the Kapruka catalog for you. You can easily add them to your cart below."
    }
  } else if (matchesDelivery) {
    let city = "Colombo"
    let charge = 300
    if (query.includes("galle")) {
      city = "Galle"
      charge = 650
    } else if (query.includes("kandy")) {
      city = "Kandy"
      charge = 550
    }
    deliveryQuote = {
      charge,
      timeline: "Delivered within 24-48 hours",
      address: `No. 45, Main Road, ${city}`,
      city,
      district: city
    }
    if (language === 'si') {
      reply = `${city} සඳහා බෙදා හැරීමේ ගාස්තුව රු. ${charge} වේ. සාමාන්‍යයෙන් පැය 24-48 අතර කාලයකදී ඇණවුම නිවසටම ලැබෙනු ඇත.`
    } else if (language === 'tanglish') {
      reply = `${city} වලට delivery charge එක Rs. ${charge} ක් වෙනවා, Machan. 24-48 hours යයි delivery වෙන්න.`
    } else {
      reply = `The estimated delivery fee to ${city} is Rs. ${charge}. Delivery timeline is 24-48 hours.`
    }
  } else if (matchesCheckout) {
    const orderId = `KAP-${Math.floor(100000 + Math.random() * 900000)}`
    checkoutLink = `https://www.kapruka.com/checkout/payment-simulate?order=${orderId}&amount=4850`
    if (language === 'si') {
      reply = "විශිෂ්ටයි! ඔබේ ඇණවුම සූදානම්. පහත ඇති සබැඳියෙන් ආරක්ෂිතව ගෙවීම් අවසන් කරන්න."
    } else if (language === 'tanglish') {
      reply = "Awesome! ඔයාගේ order එක ready. පහල තියෙන [Proceed to Secure Payment] button එකෙන් payment එක complete කරන්න."
    } else {
      reply = "Great! Your order has been compiled. Click on the button below to proceed to Kapru's secure payment gateway."
    }
  } else {
    if (language === 'si') {
      reply = "මම කප්රුක සාප්පු සහායකයා. මට පුළුවන් භාණ්ඩ සොයන්න, ඩිලිවරි ගාස්තු ගණනය කරන්න, සහ ආරක්ෂිතව ගෙවීම් කරන්න."
    } else if (language === 'tanglish') {
      reply = "Ayubowan! මම ඔයාගේ Kapruka Shopping Companion. මට පුළුවන් products search කරන්න, delivery quotes ගන්න, සහ cart එක handle කරන්න."
    } else {
      reply = "I understand! As your Kapruka Shopping Companion, I can help you search the catalog, estimate exact delivery charges, and checkout safely."
    }
  }

  return res.json({
    reply,
    products,
    deliveryQuote,
    checkoutLink,
    orderStatus
  })
}
