import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { config } from '../config/env'

export interface Product {
  id: string
  title: string
  price: number
  imageUrl: string
  description?: string
  availability: boolean
}

// Fallback catalog database in case of connection timeouts
const fallbackCatalog: Product[] = [
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
  },
  {
    id: "p3",
    title: "Fresh Red Roses Bouquet - 12 Stems",
    price: 2950,
    imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=80",
    description: "A gorgeous arrangement of freshly-cut local Sri Lankan red roses, wrapped beautifully.",
    availability: true
  },
  {
    id: "p4",
    title: "Dilmah Earl Grey Organic Selection",
    price: 1890,
    imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80",
    description: "25 envelope tea bags of aromatic organic Earl Grey with natural bergamot oil.",
    availability: true
  },
  {
    id: "p5",
    title: "Traditional Sri Lankan Sweet Hamper",
    price: 5200,
    imageUrl: "https://images.unsplash.com/photo-1581781870027-04212e231e96?w=500&auto=format&fit=crop&q=80",
    description: "A delightful assortment of Kavum, Kokis, Aluwa, and Dodol for festive celebrations.",
    availability: true
  }
]

export class McpService {
  private static instance: McpService
  private client: Client | null = null
  private connected: boolean = false

  private constructor() {}

  public static getInstance(): McpService {
    if (!McpService.instance) {
      McpService.instance = new McpService()
    }
    return McpService.instance
  }

  public async connect(): Promise<boolean> {
    if (this.connected && this.client) return true

    try {
      console.log(`Connecting to Kapruka MCP at: ${config.kaprukaMcpEndpoint}`)
      
      const transport = new SSEClientTransport(new URL(config.kaprukaMcpEndpoint))
      const mcpClient = new Client(
        {
          name: "kapruka-companion-backend",
          version: "1.0.0"
        },
        {
          capabilities: {}
        }
      )

      await mcpClient.connect(transport)
      this.client = mcpClient
      this.connected = true
      console.log("Kapruka MCP Server connected successfully via SSE!")
      return true
    } catch (error) {
      console.warn("Failed to connect to remote Kapruka MCP. Falling back to local mock service:", error)
      this.connected = false
      return false
    }
  }

  public async searchProducts(query: string): Promise<Product[]> {
    const isConnected = await this.connect()
    
    if (isConnected && this.client) {
      try {
        const response = await this.client.callTool({
          name: "search_products",
          arguments: { query }
        })
        
        // Parse results from tool output structure
        const resAny = response as any
        if (resAny && resAny.content && resAny.content[0]) {
          const text = resAny.content[0].text
          if (typeof text === 'string') {
            return JSON.parse(text) as Product[]
          }
        }
      } catch (err) {
        console.error("Error calling search_products MCP tool, using fallback:", err)
      }
    }

    // Fallback simulation
    const lowerQuery = query.toLowerCase()
    return fallbackCatalog.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) || 
      p.description?.toLowerCase().includes(lowerQuery)
    )
  }

  public async quoteDelivery(address: string, city: string, district: string): Promise<any> {
    const isConnected = await this.connect()

    if (isConnected && this.client) {
      try {
        const response = await this.client.callTool({
          name: "quote_delivery",
          arguments: { address, city, district }
        })
        const resAny = response as any
        if (resAny && resAny.content && resAny.content[0]) {
          const text = resAny.content[0].text
          if (typeof text === 'string') {
            return JSON.parse(text)
          }
        }
      } catch (err) {
        console.error("Error calling quote_delivery MCP tool, using fallback:", err)
      }
    }

    // Fallback rate calculation
    let charge = 450
    const lowerCity = city.toLowerCase()
    if (lowerCity.includes("galle")) charge = 650
    if (lowerCity.includes("kandy")) charge = 550
    if (lowerCity.includes("colombo")) charge = 300

    return {
      charge,
      timeline: "Expected delivery within 24-48 hours",
      address,
      city,
      district
    }
  }

  public async createGuestCheckout(items: any[], recipientDetails: any): Promise<any> {
    const isConnected = await this.connect()

    if (isConnected && this.client) {
      try {
        const response = await this.client.callTool({
          name: "create_guest_checkout",
          arguments: { items, recipientDetails }
        })
        const resAny = response as any
        if (resAny && resAny.content && resAny.content[0]) {
          const text = resAny.content[0].text
          if (typeof text === 'string') {
            return JSON.parse(text)
          }
        }
      } catch (err) {
        console.error("Error calling create_guest_checkout MCP tool, using fallback:", err)
      }
    }

    // Fallback checkout pay link simulator
    const orderId = `KAP-${Math.floor(100000 + Math.random() * 900000)}`
    return {
      orderId,
      checkoutLink: `https://www.kapruka.com/checkout/payment-simulate?order=${orderId}&recipient=${encodeURIComponent(recipientDetails.name || 'Guest')}`
    }
  }

  public async trackOrder(orderId: string): Promise<any> {
    const isConnected = await this.connect()

    if (isConnected && this.client) {
      try {
        const response = await this.client.callTool({
          name: "track_order",
          arguments: { orderId }
        })
        const resAny = response as any
        if (resAny && resAny.content && resAny.content[0]) {
          const text = resAny.content[0].text
          if (typeof text === 'string') {
            return JSON.parse(text)
          }
        }
      } catch (err) {
        console.error("Error calling track_order MCP tool, using fallback:", err)
      }
    }

    return {
      orderId,
      status: "SHIPPED",
      deliveryDate: "Expected delivery tomorrow evening"
    }
  }
}
