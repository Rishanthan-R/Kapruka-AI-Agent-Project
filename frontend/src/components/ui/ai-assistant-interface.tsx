"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Mic,
  ArrowUp,
  Plus,
  FileText,
  Gift,
  Truck,
  BookOpen,
  BrainCircuit,
  ShoppingCart,
  Trash2,
  MapPin,
  Globe,
  X,
  PlusCircle,
  MinusCircle,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, translations } from "../../store/useStore";
import type { Language } from "../../store/useStore";

export function AIAssistantInterface() {
  const {
    language,
    setLanguage,
    messages,
    isTyping,
    isSearching,
    sendMessage,
    clearChat,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    setGiftOptions,
    cartSubtotal,
    deliveryQuote,
    quoteDelivery,
    checkoutLink,
    createCheckout,
  } = useStore();

  const [inputValue, setInputValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [reasonEnabled, setReasonEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showUploadAnimation, setShowUploadAnimation] = useState(false);
  const [activeCommandCategory, setActiveCommandCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(true);

  // Delivery quote states
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryDistrict, setDeliveryDistrict] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  // Map suggestion categories for Kapruka shopping companion intents
  const commandSuggestions = {
    browse: [
      language === "si" ? "තේ තෑගි කට්ටල සොයන්න" : "Search Ceylon Tea Gift Sets",
      language === "si" ? "චොකලට් කේක් මිල ගණන් පෙන්වන්න" : "Show Chocolate Cake prices",
      language === "si" ? "නැවුම් රෝස මල් කළඹක් සොයන්න" : "Find Fresh Rose bouquets",
      language === "si" ? "දේශීය රසකැවිලි තෑගි හම්පර්ස්" : "Browse Sweet Hampers",
    ],
    gifts: [
      language === "si" ? "තෑගි එතීමේ විකල්ප මොනවාද?" : "What are the gift wrapping options?",
      language === "si" ? "සුබපැතුම් පතක් එක් කරන්නේ කෙසේද?" : "How do I add a greeting card message?",
      language === "si" ? "පියවරුන්ගේ දිනයට සුදුසු තෑගි යෝජනා කරන්න" : "Suggest gifts for Father's Day",
    ],
    delivery: [
      language === "si" ? "කොළඹට ඩිලිවරි ගාස්තුව කීයද?" : "What is the delivery fee to Colombo?",
      language === "si" ? "ගාල්ලට බෙදා හැරීමේ කාලය කොපමණද?" : "What is the delivery timeline for Galle?",
      language === "si" ? "මහනුවරට ඩිලිවරි කරන්න පුළුවන්ද?" : "Can you deliver to Kandy?",
    ],
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "browse") {
      if (language === "si") return "කැටලොග් එක";
      if (language === "ta") return "பட்டியல்";
      return "Browse Catalog";
    }
    if (cat === "gifts") {
      if (language === "si") return "තෑගි සහ ඇසුරුම්";
      if (language === "ta") return "பரிசுகள்";
      return "Gifts & Wrapping";
    }
    if (language === "si") return "බෙදාහැරීම්";
    if (language === "ta") return "விநியோகம்";
    return "Shipping Info";
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleUploadFile = () => {
    setShowUploadAnimation(true);
    setTimeout(() => {
      const newFile = `gift-photo.jpg`;
      setUploadedFiles((prev) => [...prev, newFile]);
      setShowUploadAnimation(false);
    }, 1500);
  };

  const handleCommandSelect = (command: string) => {
    setInputValue(command);
    setActiveCommandCategory(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleCalculateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryAddress.trim() && deliveryCity.trim() && deliveryDistrict.trim()) {
      quoteDelivery(deliveryAddress, deliveryCity, deliveryDistrict);
    }
  };

  const handleCheckoutHandoff = async () => {
    if (cart.length === 0) return;
    const link = await createCheckout(recipientName || "Guest", recipientPhone || "0771234567");
    window.open(link, "_blank");
  };

  const subtotal = cartSubtotal();
  const shipping = deliveryQuote ? deliveryQuote.charge : 350;
  const total = subtotal > 0 ? subtotal + shipping : 0;

  // Render SVG Logo with animated gradient (blue/cyan values)
  const renderLogo = (sizeClass = "w-20 h-20") => (
    <div className={`${sizeClass} relative`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        className="w-full h-full"
      >
        <g clipPath="url(#cs_clip_1_ellipse-12)">
          <mask
            id="cs_mask_1_ellipse-12"
            style={{ maskType: "alpha" }}
            width="200"
            height="200"
            x="0"
            y="0"
            maskUnits="userSpaceOnUse"
          >
            <path
              fill="#fff"
              fillRule="evenodd"
              d="M100 150c27.614 0 50-22.386 50-50s-22.386-50-50-50-50 22.386-50 50 22.386 50 50 50zm0 50c55.228 0 100-44.772 100-100S155.228 0 100 0 0 44.772 0 100s44.772 100 100 100z"
              clipRule="evenodd"
            ></path>
          </mask>
          <g mask="url(#cs_mask_1_ellipse-12)">
            <path fill="#fff" d="M200 0H0v200h200V0z"></path>
            <path fill="#0066FF" fillOpacity="0.33" d="M200 0H0v200h200V0z"></path>
            <g filter="url(#filter0_f_844_2811)" className="animate-gradient">
              <path fill="#0066FF" d="M110 32H18v68h92V32z"></path>
              <path fill="#0044FF" d="M188-24H15v98h173v-98z"></path>
              <path fill="#0099FF" d="M175 70H5v156h170V70z"></path>
              <path fill="#00CCFF" d="M230 51H100v103h130V51z"></path>
            </g>
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_844_2811"
            width="385"
            height="410"
            x="-75"
            y="-104"
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
            <feGaussianBlur result="effect1_foregroundBlur_844_2811" stdDeviation="40"></feGaussianBlur>
          </filter>
          <clipPath id="cs_clip_1_ellipse-12">
            <path fill="#fff" d="M0 0H200V200H0z"></path>
          </clipPath>
        </defs>
        <g style={{ mixBlendMode: "overlay" }} mask="url(#cs_mask_1_ellipse-12)">
          <path
            fill="gray"
            stroke="transparent"
            d="M200 0H0v200h200V0z"
            filter="url(#cs_noise_1_ellipse-12)"
          ></path>
        </g>
        <defs>
          <filter
            id="cs_noise_1_ellipse-12"
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence baseFrequency="0.6" numOctaves="5" result="out1" seed="4"></feTurbulence>
            <feComposite in="out1" in2="SourceGraphic" operator="in" result="out2"></feComposite>
            <feBlend in="SourceGraphic" in2="out2" mode="overlay" result="out3"></feBlend>
          </filter>
        </defs>
      </svg>
    </div>
  );

  // Check if we are in the landing state (conversation has not really started beyond greeting)
  const isLandingState = messages.length <= 1;

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans text-gray-700">
      
      {/* MAIN WORKSPACE: Chat thread & prompts */}
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        
        {/* Navigation / Header */}
        <header className="h-16 border-b border-gray-100 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            {renderLogo("w-8 h-8")}
            <div>
              <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Kapruka AI
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">Sri Lankan Shopping Companion</p>
            </div>
          </div>

          {/* Localization Pill & Cart Trigger */}
          <div className="flex items-center gap-3">
            <div className="bg-gray-100/80 p-0.5 rounded-full flex items-center border border-gray-200/50">
              <Globe className="w-3.5 h-3.5 text-blue-500 ml-2" />
              {(["en", "si", "ta", "tanglish"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                    language === lang
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {lang === "tanglish" ? "Tang" : lang}
                </button>
              ))}
            </div>

            <button
              onClick={clearChat}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
            >
              Clear
            </button>

            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`relative p-2 rounded-full border transition-all ${
                isCartOpen ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        {isLandingState ? (
          /* Landing State UI (Centered Input + Grid Suggestions) */
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 bg-white">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              
              {/* Logo */}
              <div className="mb-6">
                {renderLogo("w-20 h-20")}
              </div>

              {/* Welcome text */}
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 mb-2">
                    {t.welcome}
                  </h1>
                  <p className="text-sm text-gray-400 max-w-md">
                    {t.subWelcome}
                  </p>
                </motion.div>
              </div>

              {/* Prompt box */}
              {renderInputBox()}

              {/* Categories suggestion grid */}
              <div className="w-full grid grid-cols-3 gap-4 mb-4">
                <CommandButton
                  icon={<BookOpen className="w-5 h-5" />}
                  label={getCategoryLabel("browse")}
                  isActive={activeCommandCategory === "browse"}
                  onClick={() =>
                    setActiveCommandCategory(
                      activeCommandCategory === "browse" ? null : "browse"
                    )
                  }
                />
                <CommandButton
                  icon={<Gift className="w-5 h-5" />}
                  label={getCategoryLabel("gifts")}
                  isActive={activeCommandCategory === "gifts"}
                  onClick={() =>
                    setActiveCommandCategory(
                      activeCommandCategory === "gifts" ? null : "gifts"
                    )
                  }
                />
                <CommandButton
                  icon={<Truck className="w-5 h-5" />}
                  label={getCategoryLabel("delivery")}
                  isActive={activeCommandCategory === "delivery"}
                  onClick={() =>
                    setActiveCommandCategory(
                      activeCommandCategory === "delivery" ? null : "delivery"
                    )
                  }
                />
              </div>

              {/* Suggestions items */}
              {renderSuggestionsDropdown()}

            </div>
          </div>
        ) : (
          /* Conversation Thread UI */
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            
            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm flex flex-col gap-2 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none"
                        }`}
                      >
                        {/* Text Content */}
                        <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
                          {message.content}
                        </div>

                        {/* Product lists */}
                        {message.products && message.products.length > 0 && (
                          <div className="mt-3 overflow-x-auto py-2 -mx-2 flex gap-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {message.products.map((product) => (
                              <div
                                key={product.id}
                                className="min-w-[220px] max-w-[220px] rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:border-blue-400 transition-all duration-300 group"
                              >
                                <div className="relative h-28 w-full overflow-hidden bg-gray-50">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    className="h-full w-full object-cover group-hover:scale-102 transition-all duration-300"
                                  />
                                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[9px] font-bold text-emerald-600">In Stock</span>
                                  </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                                  <div>
                                    <h4 className="text-xs font-bold line-clamp-1 text-gray-800 group-hover:text-blue-600 transition-colors">
                                      {product.title}
                                    </h4>
                                    <p className="text-[9px] text-gray-400 line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <span className="text-xs font-black text-blue-600">
                                      Rs. {product.price.toLocaleString()}
                                    </span>
                                    <button
                                      onClick={() => addToCart(product)}
                                      className="px-2.5 py-1 text-[9px] font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1"
                                    >
                                      <ShoppingCart className="w-2.5 h-2.5" />
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Delivery Quote Cards */}
                        {message.deliveryQuote && (
                          <div className="mt-2 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col gap-1.5 text-xs text-gray-700 max-w-sm">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Delivery Quote</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-1 mt-1 text-[10px]">
                              <span className="text-gray-400">City / District:</span>
                              <span className="text-right font-semibold text-gray-700">
                                {message.deliveryQuote.city} / {message.deliveryQuote.district}
                              </span>
                              <span className="text-gray-400">Timeline:</span>
                              <span className="text-right text-gray-700">{message.deliveryQuote.timeline}</span>
                              <span className="text-gray-400">Shipping Charge:</span>
                              <span className="text-right font-black text-emerald-600">
                                Rs. {message.deliveryQuote.charge.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* External payment link button */}
                        {message.checkoutLink && (
                          <div className="mt-2 flex">
                            <a
                              href={message.checkoutLink}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-98 transition-all flex items-center gap-2"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {t.checkoutBtn}
                            </a>
                          </div>
                        )}

                        <span className={`text-[8px] mt-1 text-right ${message.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Skeletons */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-4 w-48 flex flex-col gap-2">
                      <div className="h-2.5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-2.5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-2.5 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    </div>
                  </div>
                )}
                {isSearching && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 overflow-hidden w-full">
                      {[...Array(2)].map((_, idx) => (
                        <div key={idx} className="min-w-[180px] rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-3">
                          <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/3"></div>
                          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Anchored bottom input block */}
            <div className="border-t border-gray-100 p-4 bg-white z-10 shrink-0">
              <div className="max-w-2xl mx-auto w-full flex flex-col gap-2">
                {renderInputBox()}
                
                {/* Suggestions pill tabs inside chat */}
                <div className="flex gap-2 justify-center mt-1">
                  {(["browse", "gifts", "delivery"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCommandCategory(activeCommandCategory === cat ? null : cat)}
                      className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                        activeCommandCategory === cat
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {cat === "browse" ? <Search className="w-3 h-3" /> : cat === "gifts" ? <Gift className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      <span>{getCategoryLabel(cat)}</span>
                    </button>
                  ))}
                </div>

                {renderSuggestionsDropdown()}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Persistent/Slide-out Cart Panel */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full bg-white border-l border-gray-100 flex flex-col z-10 shadow-lg relative shrink-0"
          >
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-800">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <span>{t.cartTitle}</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-100">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => useStore.getState().clearCart()}
                    className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors font-bold"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cart List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                  <ShoppingCart className="w-7 h-7 stroke-1 text-gray-300" />
                  <p className="text-xs">{t.emptyCart}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-gray-100 rounded-xl flex flex-col gap-2.5 shadow-sm">
                      <div className="flex gap-2.5">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold truncate text-gray-800">{item.title}</h4>
                          <p className="text-xs font-black text-blue-600 mt-0.5">Rs. {item.price.toLocaleString()}</p>
                          
                          {/* Quantity adjustments */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-bold text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors self-start"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Gift options */}
                      <div className="pt-2 border-t border-gray-50 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.giftWrap}
                            onChange={(e) => setGiftOptions(item.id, e.target.checked, item.giftMessage)}
                            className="rounded border-gray-300 bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                          />
                          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-blue-500" />
                            {t.giftWrapLabel}
                          </span>
                        </label>
                        {item.giftWrap && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-gray-400">{t.giftMessageLabel}</span>
                            <input
                              type="text"
                              value={item.giftMessage}
                              onChange={(e) => setGiftOptions(item.id, item.giftWrap, e.target.value)}
                              placeholder="e.g. Wishing you a happy birthday!"
                              className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-700 placeholder-gray-300 focus:border-blue-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery charges calculation */}
              {cart.length > 0 && (
                <form onSubmit={handleCalculateDelivery} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3 mt-4">
                  <h4 className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Delivery Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Recipient Name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Recipient Phone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street Address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-blue-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="District"
                        value={deliveryDistrict}
                        onChange={(e) => setDeliveryDistrict(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1.5 active:scale-97 transition-all"
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      Calculate Delivery
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3.5">
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>{t.subtotal}:</span>
                    <span className="font-semibold text-gray-800">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.deliveryCharge}:</span>
                    <span className="font-semibold text-gray-800">
                      {deliveryQuote ? `Rs. ${shipping}` : "Pending Quote"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-200 text-blue-600">
                    <span>{t.total}:</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutLink ? (
                  <a
                    href={checkoutLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-105 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <CreditCard className="w-4 h-4 animate-pulse" />
                    {t.checkoutBtn}
                  </a>
                ) : (
                  <button
                    onClick={handleCheckoutHandoff}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Prepare Pay Link
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper renderer: Prompt input box matching user template style
  function renderInputBox() {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4 max-w-2xl mx-auto">
        <div className="p-4 flex items-center bg-white">
          <input
            ref={inputRef}
            type="text"
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="w-full text-gray-700 text-sm outline-none placeholder:text-gray-400 bg-white"
          />
        </div>

        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pb-3 bg-white">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-50 py-1 px-2 rounded-md border border-gray-200"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] text-gray-700 font-bold">{file}</span>
                  <button
                    onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button bar */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchEnabled(!searchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                searchEnabled
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setDeepResearchEnabled(!deepResearchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                deepResearchEnabled
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={deepResearchEnabled ? "text-blue-600" : "text-gray-400"}
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                <circle cx="8" cy="8" r="3" fill="currentColor" />
              </svg>
              <span>Deep Research</span>
            </button>
            <button
              onClick={() => setReasonEnabled(!reasonEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                reasonEnabled
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Reason</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                inputValue.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Upload file drawer link */}
        <div className="px-4 py-2 border-t border-gray-50 bg-white/50">
          <button
            onClick={handleUploadFile}
            className="flex items-center gap-1.5 text-gray-500 text-[11px] hover:text-gray-800 transition-colors"
          >
            {showUploadAnimation ? (
              <motion.div
                className="flex space-x-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.4,
                          repeat: Infinity,
                          repeatType: "mirror",
                          delay: i * 0.1,
                        },
                      },
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Upload Image File</span>
          </button>
        </div>
      </div>
    );
  }

  // Helper renderer: suggestion items accordion dropdown
  function renderSuggestionsDropdown() {
    return (
      <AnimatePresence>
        {activeCommandCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mb-6 overflow-hidden max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t.suggestionsHeader}
                </h3>
              </div>
              <ul className="divide-y divide-gray-150">
                {commandSuggestions[activeCommandCategory as keyof typeof commandSuggestions].map(
                  (suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleCommandSelect(suggestion)}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-75 text-xs text-gray-700 flex items-center gap-2.5 font-medium"
                    >
                      {activeCommandCategory === "browse" ? (
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                      ) : activeCommandCategory === "gifts" ? (
                        <Gift className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{suggestion}</span>
                    </motion.li>
                  )
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
}

interface CommandButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function CommandButton({ icon, label, isActive, onClick }: CommandButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all ${
        isActive ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`${isActive ? "text-blue-600" : "text-gray-400"}`}>{icon}</div>
      <span className={`text-[11px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-gray-500"}`}>
        {label}
      </span>
    </motion.button>
  );
}
