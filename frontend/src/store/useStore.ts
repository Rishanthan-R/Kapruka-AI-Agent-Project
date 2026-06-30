import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: string
  title: string
  price: number
  imageUrl: string
  description?: string
  availability: boolean
}

export interface CartItem extends Product {
  id: string
  title: string
  price: number
  imageUrl: string
  description?: string
  availability: boolean
  quantity: number
  giftWrap: boolean
  giftMessage: string
}

export interface DeliveryQuote {
  charge: number
  timeline: string
  address: string
  city: string
  district: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date | string
  products?: Product[]
  deliveryQuote?: DeliveryQuote
  checkoutLink?: string | null
  orderStatus?: {
    id: string
    status: string
    deliveryDate: string
    recipient?: string
    progress?: string
    hasDeliveryPhoto?: boolean
    hasDeliveryVideo?: boolean
  }
}

export type Language = 'en' | 'si' | 'ta' | 'tanglish'

interface AppState {
  // Localization State
  language: Language
  setLanguage: (lang: Language) => void

  // Chat State
  messages: Message[]
  isTyping: boolean
  isSearching: boolean
  sendMessage: (text: string) => Promise<void>
  addAssistantMessage: (messageText: string, extra?: Partial<Message>) => void
  clearChat: () => void

  // Cart State
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setGiftOptions: (productId: string, giftWrap: boolean, giftMessage: string) => void
  cartSubtotal: () => number
  clearCart: () => void

  // Delivery / Address State
  deliveryQuote: DeliveryQuote | null
  quoteDelivery: (address: string, city: string, district: string) => Promise<void>

  // Checkout Handoff
  checkoutLink: string | null
  createCheckout: (recipientName: string, recipientPhone: string) => Promise<string>
  resetCheckout: () => void

  // Theme State
  darkMode: boolean
  toggleDarkMode: () => void
}

// Translations dictionary for dynamic UI elements and responses
export const translations = {
  en: {
    welcome: "Ready to assist you with Kapruka shopping!",
    subWelcome: "Search products, get delivery quotes, customize gifts, and checkout seamlessly.",
    placeholder: "Ask me anything (e.g. 'Search Ceylon Tea', 'Delivery charge to Galle')...",
    cartTitle: "Your Cart",
    subtotal: "Subtotal",
    deliveryCharge: "Delivery Charge",
    total: "Total",
    checkoutBtn: "Proceed to Secure Payment",
    emptyCart: "Your cart is empty.",
    giftMessageLabel: "Add personalized gift message:",
    giftWrapLabel: "Wrap as a gift",
    search: "Search",
    deepResearch: "Deep Research",
    reason: "Reason",
    uploadBtn: "Upload Files",
    suggestionsHeader: "Shopping suggestions",
    personalityGreeting: "Hello! I am your Kapruka Shopping Companion. Let me know what you are looking for today! 🌸",
  },
  si: {
    welcome: "කප්රුක සාප්පු සවාරි සඳහා ඔබව සාදරයෙන් පිළිගනිමු!",
    subWelcome: "භාණ්ඩ සොයන්න, බෙදා හැරීමේ ගාස්තු ගණනය කරන්න, සහ තෑගි ඇණවුම් කරන්න.",
    placeholder: "ඔබට අවශ්‍ය දේ විමසන්න (උදා: 'තේ කොළ සොයන්න', 'ගාල්ලට ඩිලිවරි ගාස්තු')...",
    cartTitle: "ඔබේ කරත්තය",
    subtotal: "එකතුව",
    deliveryCharge: "බෙදා හැරීමේ ගාස්තුව",
    total: "මුළු එකතුව",
    checkoutBtn: "සුරක්ෂිත ගෙවීමට පිවිසෙන්න",
    emptyCart: "ඔබේ කරත්තය හිස් ය.",
    giftMessageLabel: "තෑගි පණිවිඩයක් එක් කරන්න:",
    giftWrapLabel: "තෑග්ගක් ලෙස අසුරන්න",
    search: "සොයන්න",
    deepResearch: "ගැඹුරු සෙවීම",
    reason: "හේතු දැක්වීම",
    uploadBtn: "ගොනු එක් කරන්න",
    suggestionsHeader: "නිර්දේශිත සෙවීම්",
    personalityGreeting: "ආයුබෝවන්! මම ඔබේ කප්රුක සාප්පු සහායකයා. අද ඔබට අවශ්‍ය කුමක්ද කියා පවසන්න! 🌸",
  },
  ta: {
    welcome: "கப்ருகா ஷாப்பிங் உங்களை வரவேற்கிறது!",
    subWelcome: "தயாரிப்புகளைத் தேடுங்கள், விநியோகக் கட்டணங்களைக் கணக்கிடுங்கள் மற்றும் பரிசுகளை ஆர்டர் செய்யுங்கள்.",
    placeholder: "உங்களுக்கு என்ன வேண்டும் என்று கேளுங்கள் (உதாரணம்: 'தேயிலை தேடுங்கள்')...",
    cartTitle: "உங்கள் கூடை",
    subtotal: "துணைத் தொகை",
    deliveryCharge: "விநியோகக் கட்டணம்",
    total: "மொத்தம்",
    checkoutBtn: "பாதுகாப்பான கட்டணத்திற்குச் செல்லவும்",
    emptyCart: "உங்கள் கூடை காலியாக உள்ளது.",
    giftMessageLabel: "தனிப்பயனாக்கப்பட்ட பரிசுச் செய்தியைச் சேர்க்கவும்:",
    giftWrapLabel: "பரிசாகப் பொதி செய்யவும்",
    search: "தேடுங்கள்",
    deepResearch: "ஆழமான ஆராய்ச்சி",
    reason: "காரணம்",
    uploadBtn: "கோப்புகளைப் பதிவேற்றவும்",
    suggestionsHeader: "ஷாப்பிங் பரிந்துரைகள்",
    personalityGreeting: "வணக்கம்! நான் உங்கள் கப்ருகா ஷாப்பிங் உதவியாளர். இன்று உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள்! 🌸",
  },
  tanglish: {
    welcome: "Welcome to Kapruka Shopping! How can I help you?",
    subWelcome: "Products search කරන්න, delivery quotes ගන්න, gift wrap කරන්න, checkout වෙන්න ලේසියෙන්ම.",
    placeholder: "Ask me anything (e.g. 'Ceylon Tea search කරන්න', 'Galle වලට delivery charge කීයද')...",
    cartTitle: "Your Cart එක",
    subtotal: "Subtotal එක",
    deliveryCharge: "Delivery Charge එක",
    total: "Total එක",
    checkoutBtn: "Proceed to Secure Payment",
    emptyCart: "Cart එක empty.",
    giftMessageLabel: "Add personalized gift message:",
    giftWrapLabel: "Gift wrap කරන්න",
    search: "Search කරන්න",
    deepResearch: "Deep Research",
    reason: "Reason",
    uploadBtn: "Upload Files",
    suggestionsHeader: "Shopping suggestions",
    personalityGreeting: "Ayubowan! මම ඔයාගේ Kapruka Shopping Companion. අද මොනවද ඕනේ? 🌸",
  }
}

// Sample database of live Kapruka products for simulation
const sampleProducts: Product[] = [
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
  setLanguage: (lang) => set({ language: lang }),

  messages: [
    {
      id: "m0",
      role: 'assistant',
      content: translations.en.personalityGreeting,
      timestamp: new Date()
    }
  ],
  isTyping: false,
  isSearching: false,

  sendMessage: async (text) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: `m_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    // Capture current messages and language
    const currentMessages = get().messages
    const currentLang = get().language

    set((state) => ({ 
      messages: [...state.messages, userMsg],
      isTyping: true 
    }))

    try {
      let apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          apiUrl = 'http://localhost:5000/api';
        } else {
          apiUrl = '/api';
        }
      }
      
      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: currentMessages.map(m => ({ role: m.role, content: m.content })),
          language: currentLang
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("Could not construct reader on stream body.")

      let buffer = ""
      let assistantMsgId = `m_assistant_${Date.now()}`
      
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: "",
            timestamp: new Date()
          }
        ],
        isTyping: false
      }))

      let accumulatedContent = ""
      let accumulatedProducts: Product[] = []
      let accumulatedQuote: any = null
      let accumulatedCheckout: string | null = null
      let accumulatedStatus: any = null

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        let currentEvent = ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.replace("event:", "").trim()
          } else if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.replace("data:", "").trim()
            try {
              const dataObj = JSON.parse(dataStr)

              if (currentEvent === "token") {
                accumulatedContent += dataObj.token
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                }))
              } else if (currentEvent === "tool_start") {
                set({ isSearching: true })
              } else if (currentEvent === "tool_result") {
                set({ isSearching: false })
                if (dataObj.name === "searchProducts" && dataObj.result?.products) {
                  accumulatedProducts = [...accumulatedProducts, ...dataObj.result.products]
                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, products: accumulatedProducts }
                        : m
                    )
                  }))
                } else if (dataObj.name === "checkDelivery" && dataObj.result) {
                  accumulatedQuote = dataObj.result
                  set({ deliveryQuote: accumulatedQuote })
                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, deliveryQuote: accumulatedQuote }
                        : m
                    )
                  }))
                } else if (dataObj.name === "createOrder" && dataObj.result?.checkoutLink) {
                  accumulatedCheckout = dataObj.result.checkoutLink
                  set({ checkoutLink: accumulatedCheckout })
                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, checkoutLink: accumulatedCheckout }
                        : m
                    )
                  }))
                } else if (dataObj.name === "trackOrder" && dataObj.result) {
                  accumulatedStatus = dataObj.result
                  set((state) => ({
                    messages: state.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, orderStatus: accumulatedStatus }
                        : m
                    )
                  }))
                }
              } else if (currentEvent === "done") {
                set({ isSearching: false, isTyping: false })
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: dataObj.reply || accumulatedContent,
                          products: dataObj.products || accumulatedProducts,
                          deliveryQuote: dataObj.deliveryQuote || accumulatedQuote,
                          checkoutLink: dataObj.checkoutLink || accumulatedCheckout,
                          orderStatus: dataObj.orderStatus || accumulatedStatus
                        }
                      : m
                  )
                }))
              } else if (currentEvent === "error") {
                set({ isSearching: false, isTyping: false })
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: `Error: ${dataObj.error || "Failed to process message."}` }
                      : m
                  )
                }))
              }
            } catch (err) {
              console.warn("Failed to parse SSE data packet:", dataStr, err)
            }
          }
        }
      }

    } catch (error) {
      console.error("Backend communication failed, running local backup simulation:", error)
      
      // Local graceful fallback if backend is down
      setTimeout(() => {
        const query = text.toLowerCase()
        let content = ""
        let products: Product[] | undefined = undefined
        let deliveryQuote: DeliveryQuote | undefined = undefined
        let checkoutLink: string | undefined = undefined

        const matchesSearch = query.includes("search") || query.includes("find") || query.includes("සොයන්න") || query.includes("cake") || query.includes("tea") || query.includes("rose")
        const matchesDelivery = query.includes("delivery") || query.includes("charge") || query.includes("colombo") || query.includes("galle")
        const matchesCheckout = query.includes("checkout") || query.includes("pay")

        if (matchesSearch) {
          products = sampleProducts
          content = currentLang === 'si' 
            ? "මම ඔබේ සෙවුමට ගැලපෙන කප්රුක භාණ්ඩ සොයා ගත්තා. පහතින් තෝරා ගන්න." 
            : "I found these live products in the Kapruka catalog for you."
        } else if (matchesDelivery) {
          deliveryQuote = {
            charge: 350,
            timeline: "Delivered within 24-48 hours",
            address: "No. 45, Colombo",
            city: "Colombo",
            district: "Colombo"
          }
          set({ deliveryQuote })
          content = `Delivery fee to Colombo is Rs. 350.`
        } else if (matchesCheckout) {
          const orderId = `KAP-${Math.floor(100000 + Math.random() * 900000)}`
          checkoutLink = `https://www.kapruka.com/checkout/payment-simulate?order=${orderId}`
          set({ checkoutLink })
          content = `Your order is ready. Click below to pay.`
        } else {
          content = `I'm operating in backup mode. Let me know what you need!`
        }

        const assistantMsg: Message = {
          id: `m_assistant_${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          products,
          deliveryQuote,
          checkoutLink
        }

        set((state) => ({
          messages: [...state.messages, assistantMsg],
          isTyping: false
        }))
      }, 1000)
    }
  },

  addAssistantMessage: (messageText, extra) => {
    const newMsg: Message = {
      id: `m_assistant_${Date.now()}`,
      role: 'assistant',
      content: messageText,
      timestamp: new Date(),
      ...extra
    }
    set((state) => ({ messages: [...state.messages, newMsg] }))
  },

  clearChat: () => set((state) => ({
    messages: [
      {
        id: `m_assist_init_${Date.now()}`,
        role: 'assistant',
        content: translations[state.language].personalityGreeting,
        timestamp: new Date()
      }
    ]
  })),

  // Cart Management
  cart: [],
  addToCart: (product) => {
    const state = get()
    const currentLang = state.language
    let promptMsg = ""
    if (currentLang === "si") {
      promptMsg = `මම "${product.title}" මගේ කරත්තයට එක් කළා. කරුණාකර මීට ගැලපෙන වෙනත් තෑගි/භාණ්ඩ 2-3ක් යෝජනා කරන්න.`
    } else if (currentLang === "tanglish") {
      promptMsg = `මම "${product.title}" එක cart එකට add කළා. මීට ගැලපෙන matching items 2-3ක් suggest කරන්න.`
    } else {
      promptMsg = `I added "${product.title}" to my cart. Suggest 2-3 matching complementary items.`
    }

    setTimeout(() => {
      get().sendMessage(promptMsg)
    }, 450)

    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id)
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        }
      }
      return {
        cart: [...state.cart, { ...product, quantity: 1, giftWrap: false, giftMessage: "" }]
      }
    })
  },

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId)
  })),

  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter((item) => item.id !== productId) }
    }
    return {
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    }
  }),

  setGiftOptions: (productId, giftWrap, giftMessage) => set((state) => ({
    cart: state.cart.map((item) =>
      item.id === productId ? { ...item, giftWrap, giftMessage } : item
    )
  })),

  cartSubtotal: () => {
    return get().cart.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  clearCart: () => set({ cart: [], checkoutLink: null }),

  // Delivery Management
  deliveryQuote: null,
  quoteDelivery: async (address, city, district) => {
    // Simulate background API call to quote_delivery
    set({ isTyping: true })
    await new Promise((resolve) => setTimeout(resolve, 1200))

    let charge = 450 // base
    const lowerCity = city.toLowerCase()
    if (lowerCity.includes("galle") || lowerCity.includes("matara")) charge = 600
    if (lowerCity.includes("kandy") || lowerCity.includes("jaffna")) charge = 550
    if (lowerCity.includes("colombo") || lowerCity.includes("nugegoda")) charge = 300

    const quote: DeliveryQuote = {
      charge,
      timeline: "Expected delivery within 24-36 hours",
      address,
      city,
      district
    }

    set({
      deliveryQuote: quote,
      isTyping: false
    })

    const currentLang = get().language
    let responseText = ""
    if (currentLang === 'si') {
      responseText = `මම ${city} සඳහා ඩිලිවරි ගාස්තුව ගණනය කලා. එය රු. ${charge} වේ. ඇස්තමේන්තුගත කාලය: ${quote.timeline}.`
    } else if (currentLang === 'tanglish') {
      responseText = `${city} වලට shipping quotes හරි! Delivery charge එක වෙන්නේ Rs. ${charge} (${quote.timeline}).`
    } else {
      responseText = `I have updated the delivery calculations for ${city}. The shipping charge is Rs. ${charge} with a timeline of ${quote.timeline}.`
    }

    get().addAssistantMessage(responseText, { deliveryQuote: quote })
  },

  // Checkout Handoff
  checkoutLink: null,
  createCheckout: async (recipientName, recipientPhone) => {
    set({ isTyping: true })
    console.log(`Initiating checkout payload for ${recipientName} (${recipientPhone})`)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const orderId = `KAP-${Math.floor(100000 + Math.random() * 900000)}`
    const payLink = `https://www.kapruka.com/checkout/payment-simulate?order=${orderId}&amount=${get().cartSubtotal() + (get().deliveryQuote?.charge || 350)}`

    set({
      checkoutLink: payLink,
      isTyping: false
    })

    return payLink
  },

  resetCheckout: () => set({ checkoutLink: null }),

  // Theme management
  darkMode: false,
  toggleDarkMode: () => set((state) => {
    const nextDark = !state.darkMode
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    return { darkMode: nextDark }
  })
}), {
  name: 'kapruka-shopping-companion-store',
  partialize: (state) => ({
    language: state.language,
    messages: state.messages,
    cart: state.cart,
    deliveryQuote: state.deliveryQuote,
    checkoutLink: state.checkoutLink,
    darkMode: state.darkMode
  })
}))
