import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { config } from '../config/env'
import { writeDebugLog } from '../utils/debugLogger'

export interface Product {
  id: string
  title: string
  price: number
  imageUrl: string
  description?: string
  availability: boolean
}

/**
 * Helper to extract text content from an MCP tool response.
 * The response shape is { content: [{ text: string }] }.
 * Returns the parsed JSON, or null if parsing fails.
 */
function extractToolResponse(response: unknown, toolName: string): any | null {
  const resAny = response as any
  writeDebugLog(`mcp_debug_${toolName}.json`, { rawResponse: response })

  if (resAny && resAny.content && Array.isArray(resAny.content)) {
    for (const part of resAny.content) {
      if (part.text && typeof part.text === 'string') {
        try {
          return JSON.parse(part.text)
        } catch {
          // If it's not JSON, return the raw text
          return part.text
        }
      }
    }
  }
  return null
}

export class McpService {
  private static instance: McpService
  private client: Client | null = null
  private transport: StreamableHTTPClientTransport | SSEClientTransport | null = null
  private connected: boolean = false

  private constructor() {}

  public static getInstance(): McpService {
    if (!McpService.instance) {
      McpService.instance = new McpService()
    }
    return McpService.instance
  }

  /**
   * Connect to the live Kapruka MCP server.
   * Tries Streamable HTTP first (preferred), falls back to SSE.
   */
  public async connect(): Promise<boolean> {
    if (this.connected && this.client) return true

    const endpoint = config.kaprukaMcpEndpoint || 'https://mcp.kapruka.com/mcp'

    let lastStreamableError: any = null

    // Try Streamable HTTP transport first (the Kapruka server supports this)
    try {
      console.log(`Connecting to Kapruka MCP via Streamable HTTP: ${endpoint}`)

      this.transport = new StreamableHTTPClientTransport(new URL(endpoint))

      const mcpClient = new Client(
        {
          name: "kapruka-companion-backend",
          version: "1.0.0"
        },
        {
          capabilities: {}
        }
      )

      await mcpClient.connect(this.transport)
      this.client = mcpClient
      this.connected = true
      console.log("✅ Kapruka MCP Server connected successfully via Streamable HTTP!")

      // List available tools for verification
      try {
        const toolsList = await mcpClient.listTools()
        const toolNames = toolsList.tools.map((t: any) => t.name)
        console.log("Available Kapruka MCP Tools:", toolNames.join(", "))
      } catch (err) {
        console.warn("Could not list MCP tools (non-fatal):", err)
      }

      return true
    } catch (streamableError) {
      lastStreamableError = streamableError
      console.warn("Streamable HTTP failed, trying SSE fallback...", streamableError)
    }

    // Fallback to SSE transport
    try {
      console.log(`Connecting to Kapruka MCP via SSE fallback: ${endpoint}`)

      this.transport = new SSEClientTransport(new URL(endpoint))

      const mcpClient = new Client(
        {
          name: "kapruka-companion-backend",
          version: "1.0.0"
        },
        {
          capabilities: {}
        }
      )

      await mcpClient.connect(this.transport)
      this.client = mcpClient
      this.connected = true
      console.log("✅ Kapruka MCP Server connected successfully via SSE!")

      try {
        const toolsList = await mcpClient.listTools()
        const toolNames = toolsList.tools.map((t: any) => t.name)
        console.log("Available Kapruka MCP Tools:", toolNames.join(", "))
      } catch (err) {
        console.warn("Could not list MCP tools (non-fatal):", err)
      }

      return true
    } catch (sseError) {
      this.connected = false
      console.error("Failed to connect to Kapruka MCP via both transports.")
      console.error("Streamable HTTP error:", lastStreamableError)
      console.error("SSE error:", sseError)
      throw sseError
    }
  }

  /**
   * Search live Kapruka product catalog.
   * Remote tool: kapruka_search_products
   * Input: { q, category?, limit?, currency?, in_stock_only?, sort?, response_format }
   * Output: { results: [...], next_cursor, applied_filters }
   */
  public async searchProducts(query: string, category?: string): Promise<Product[]> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    try {
      const response = await this.client.callTool({
        name: "kapruka_search_products",
        arguments: {
          params: {
            q: query,
            ...(category ? { category } : {}),
            limit: 10,
            in_stock_only: true,
            response_format: "json"
          }
        }
      })

      writeDebugLog('mcp_debug_calls.json', { method: 'searchProducts', query, response })

      const data = extractToolResponse(response, "kapruka_search_products")
      if (data && data.results && Array.isArray(data.results)) {
        return data.results.map((item: any) => ({
          id: item.id,
          title: item.name,
          price: item.price?.amount || 0,
          imageUrl: item.image_url || "",
          description: item.summary || "",
          availability: item.in_stock !== false
        }))
      }
    } catch (err: any) {
      writeDebugLog('mcp_debug_calls.json', { method: 'searchProducts', query, error: err.message || err })
      throw err
    }
    
    return []
  }

  /**
   * Get full details for a single product.
   * Remote tool: kapruka_get_product
   * Input: { product_id, currency?, response_format }
   */
  public async getProduct(productId: string): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    const response = await this.client.callTool({
      name: "kapruka_get_product",
      arguments: {
        params: {
          product_id: productId,
          response_format: "json"
        }
      }
    })
    
    return extractToolResponse(response, "kapruka_get_product")
  }

  /**
   * Check delivery feasibility and rate for a Sri Lankan city.
   * Remote tool: kapruka_check_delivery
   * Input: { city, delivery_date?, product_id?, response_format }
   * Output: { city, available, rate, currency, checked_date, reason?, next_available_date?, perishable_warning? }
   */
  public async quoteDelivery(address: string, city: string, district: string): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    try {
      const response = await this.client.callTool({
        name: "kapruka_check_delivery",
        arguments: {
          params: {
            city,
            response_format: "json"
          }
        }
      })

      writeDebugLog('mcp_debug_calls.json', { method: 'quoteDelivery', city, response })

      const data = extractToolResponse(response, "kapruka_check_delivery")
      if (data && typeof data === 'object') {
        return {
          charge: data.rate || 0,
          timeline: data.available
            ? `Delivery available on ${data.checked_date}`
            : `Not available: ${data.reason || 'Unknown'}. Next: ${data.next_available_date || 'N/A'}`,
          address,
          city: data.city || city,
          district,
          available: data.available,
          perishable_warning: data.perishable_warning || null
        }
      }

      if (data && typeof data === 'string') {
        return {
          charge: 0,
          timeline: data,
          address,
          city,
          district,
          available: false,
          perishable_warning: null
        }
      }
    } catch (err: any) {
      writeDebugLog('mcp_debug_calls.json', { method: 'quoteDelivery', city, error: err.message || err })
      throw err
    }
    
    return {
      charge: 0,
      timeline: "Failed to retrieve delivery quote from Kapruka MCP.",
      address,
      city,
      district,
      available: false,
      perishable_warning: null
    }
  }

  /**
   * List cities Kapruka delivers to, with optional search filter.
   * Remote tool: kapruka_list_delivery_cities
   * Input: { query?, limit?, response_format }
   * Output: { cities: [{name, aliases}], total_matched, showing }
   */
  public async listDeliveryCities(query?: string): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    const response = await this.client.callTool({
      name: "kapruka_list_delivery_cities",
      arguments: {
        params: {
          ...(query ? { query } : {}),
          limit: 25,
          response_format: "json"
        }
      }
    })
    
    return extractToolResponse(response, "kapruka_list_delivery_cities")
  }

  /**
   * Create a guest-checkout order and get a click-to-pay link.
   * Remote tool: kapruka_create_order
   * Input: { cart, recipient, delivery, sender, gift_message?, currency?, response_format }
   * Output: { checkout_url, order_ref, summary: { items_total, delivery_fee, addons_total, grand_total, currency }, expires_at }
   */
  public async createGuestCheckout(items: any[], recipientDetails: any, deliveryDetails?: any, senderDetails?: any, giftMessage?: string): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    // Map internal cart items to Kapruka's expected format
    const cart = items.map((item: any) => ({
      product_id: item.id || item.product_id,
      quantity: item.quantity || 1,
      ...(item.icing_text ? { icing_text: item.icing_text } : {})
    }))

    const recipient = {
      name: recipientDetails.name || "Guest",
      phone: recipientDetails.phone || recipientDetails.recipientPhone || "+94771234567"
    }

    // Build today's date in YYYY-MM-DD for delivery
    const today = new Date()
    const deliveryDate = deliveryDetails?.date || today.toISOString().split('T')[0]

    const delivery = {
      address: deliveryDetails?.address || "No. 1, Main Street",
      city: deliveryDetails?.city || "Colombo",
      location_type: deliveryDetails?.location_type || "house",
      date: deliveryDate,
      ...(deliveryDetails?.instructions ? { instructions: deliveryDetails.instructions } : {})
    }

    const sender = {
      name: senderDetails?.name || recipientDetails.name || "Anonymous",
      anonymous: senderDetails?.anonymous || false
    }

    const response = await this.client.callTool({
      name: "kapruka_create_order",
      arguments: {
        params: {
          cart,
          recipient,
          delivery,
          sender,
          ...(giftMessage ? { gift_message: giftMessage } : {}),
          currency: "LKR",
          response_format: "json"
        }
      }
    })

    const data = extractToolResponse(response, "kapruka_create_order")
    if (data && typeof data === 'object') {
      return {
        orderId: data.order_ref || "N/A",
        checkoutLink: data.checkout_url || "",
        summary: data.summary || null,
        expiresAt: data.expires_at || null
      }
    }
    
    throw new Error("Failed to compile checkout link from Kapruka MCP.")
  }

  /**
   * Track an existing Kapruka order by order number.
   * Remote tool: kapruka_track_order
   * Input: { order_number, response_format }
   * Output: { order_number, status, status_display, recipient, progress, items, ... }
   */
  public async trackOrder(orderNumber: string): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    const response = await this.client.callTool({
      name: "kapruka_track_order",
      arguments: {
        params: {
          order_number: orderNumber,
          response_format: "json"
        }
      }
    })

    const data = extractToolResponse(response, "kapruka_track_order")
    if (data && typeof data === 'object') {
      return {
        orderId: data.order_number,
        status: data.status_display || data.status,
        deliveryDate: data.delivery_date || "Pending",
        recipient: data.recipient,
        progress: data.progress,
        items: data.items,
        hasDeliveryPhoto: data.has_delivery_photo,
        hasDeliveryVideo: data.has_delivery_video
      }
    }
    
    throw new Error(`Failed to retrieve tracking status for order ${orderNumber} from Kapruka MCP.`)
  }

  /**
   * List product categories on Kapruka.
   * Remote tool: kapruka_list_categories
   * Input: { depth?, response_format }
   * Output: { categories: [{ name, url, children }] }
   */
  public async browseCategories(depth: number = 1): Promise<any> {
    await this.connect()

    if (!this.client) {
      throw new Error("Kapruka MCP client is not connected.")
    }

    const response = await this.client.callTool({
      name: "kapruka_list_categories",
      arguments: {
        params: {
          depth,
          response_format: "json"
        }
      }
    })

    const data = extractToolResponse(response, "kapruka_list_categories")
    if (data && data.categories) {
      return {
        categories: data.categories.map((cat: any) => ({
          name: cat.name,
          url: cat.url,
          children: cat.children || []
        }))
      }
    }
    
    return { categories: [] }
  }

  /**
   * Gracefully disconnect from the MCP server.
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close()
      } catch (err) {
        console.warn("Error closing MCP client:", err)
      }
      this.client = null
      this.connected = false
    }
  }
}
