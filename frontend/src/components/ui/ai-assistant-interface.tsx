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
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, translations } from "../../store/useStore";
import brandLogo from "../../assets/kapruka_ai_agent_logo.png";

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
    darkMode,
    toggleDarkMode,
  } = useStore();

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [reasonEnabled, setReasonEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showUploadAnimation, setShowUploadAnimation] = useState(false);
  const [activeCommandCategory, setActiveCommandCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Delivery quote states
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryDistrict, setDeliveryDistrict] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  // Initialize and keep document theme class in sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Speech Recognition effect
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "si" ? "si-LK" : language === "ta" ? "ta-LK" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

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


  // Check if we are in the landing state (conversation has not really started beyond greeting)
  const isLandingState = messages.length <= 1;

  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-zinc-950 overflow-hidden font-sans text-gray-700 dark:text-zinc-200">
      
      {/* MAIN WORKSPACE: Chat thread & prompts */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 relative overflow-hidden">
        
        {/* Navigation / Header */}
        <header className="h-16 border-b border-brand-purple-light/10 px-4 md:px-6 flex items-center justify-between bg-brand-purple text-white z-20 shrink-0 shadow-md relative">
          <div className="flex items-center gap-3">
            <img src={brandLogo} className="h-9 md:h-11 w-auto object-contain rounded" alt="Kapruka AI Shopping Agent" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Language Selector */}
              <div className="bg-white/10 p-0.5 rounded-full flex items-center border border-white/10">
                <Globe className="w-3.5 h-3.5 text-brand-yellow ml-2" />
                {(["en", "si", "ta", "tanglish"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                      language === lang
                        ? "bg-brand-yellow text-brand-purple shadow-sm"
                        : "text-purple-200 hover:text-white"
                    }`}
                  >
                    {lang === "tanglish" ? "Tang" : lang}
                  </button>
                ))}
              </div>

              <button
                onClick={clearChat}
                className="text-xs px-2.5 py-1 rounded-md border border-white/20 hover:bg-white/10 transition-all text-white font-bold"
              >
                Clear
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-all"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4 text-purple-200" />}
              </button>
            </div>

            {/* Cart Trigger (Visible on both Mobile & Desktop) */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`relative p-2 rounded-full border transition-all ${
                isCartOpen ? "bg-brand-yellow border-brand-yellow text-brand-purple" : "bg-white/10 border-white/20 text-purple-200 hover:bg-white/20 hover:text-white"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-yellow text-brand-purple font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-brand-purple/15 shadow-sm animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Mobile Settings Toggle */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`md:hidden p-2 rounded-full border transition-all ${
                isSettingsOpen ? "bg-white/20 border-white/30 text-white" : "bg-white/10 border-white/20 text-purple-200 hover:bg-white/20"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Settings Dropdown/Popover */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-18 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg p-4 z-30 flex flex-col gap-3.5 min-w-[240px] text-gray-800 dark:text-zinc-200 md:hidden"
              >
                {/* Language selection block */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-zinc-500">Language</span>
                  <div className="grid grid-cols-4 bg-gray-50 dark:bg-zinc-950 rounded-lg p-0.5 border border-gray-100 dark:border-zinc-800 text-xs">
                    {(["en", "si", "ta", "tanglish"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`py-1 rounded-md uppercase font-black text-center transition-all ${
                          language === lang
                            ? "bg-brand-purple text-white shadow-sm"
                            : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                        }`}
                      >
                        {lang === "tanglish" ? "Tang" : lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark mode & Clear actions row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-zinc-500">Theme</span>
                    <button
                      onClick={toggleDarkMode}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                      {darkMode ? <Sun className="w-3.5 h-3.5 text-brand-yellow" /> : <Moon className="w-3.5 h-3.5 text-brand-purple" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      clearChat();
                      setIsSettingsOpen(false);
                    }}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-450 transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content Area */}
        {isLandingState ? (
          /* Landing State UI (Centered Input + Grid Suggestions) */
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              
              {/* Logo */}
              <div className="mb-6">
                <img src={brandLogo} className="h-16 w-auto object-contain rounded-xl shadow-md border border-brand-purple-light/10" alt="Kapruka AI Shopping Agent" />
              </div>

              {/* Welcome text */}
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-purple-light mb-2">
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
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
            
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
                            ? "bg-brand-purple text-white rounded-tr-none"
                            : "bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-zinc-100 rounded-tl-none"
                        }`}
                      >
                        {/* Text Content */}
                        <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
                          {message.content}
                        </div>

                        {/* Product lists */}
                        {message.products && message.products.length > 0 && (
                          <div className="mt-3 overflow-x-auto py-2 -mx-2 flex gap-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {message.products.map((product) => (
                              <div
                                key={product.id}
                                className="min-w-[220px] max-w-[220px] rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col justify-between shadow-sm hover:border-brand-purple/40 transition-all duration-300 group"
                              >
                                <div className="relative h-28 w-full overflow-hidden bg-gray-50 dark:bg-zinc-800">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    className="h-full w-full object-cover group-hover:scale-102 transition-all duration-300"
                                  />
                                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-gray-100 dark:border-zinc-800 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">In Stock</span>
                                  </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                                  <div>
                                    <h4 className="text-xs font-bold line-clamp-1 text-gray-800 dark:text-zinc-200 group-hover:text-brand-purple transition-colors">
                                      {product.title}
                                    </h4>
                                    <p className="text-[9px] text-gray-400 dark:text-zinc-400 line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <span className="text-xs font-black text-brand-purple">
                                      Rs. {product.price.toLocaleString()}
                                    </span>
                                    <button
                                      onClick={() => addToCart(product)}
                                      className="px-2.5 py-1 text-[9px] font-bold bg-brand-purple text-white rounded-md hover:bg-brand-purple-light transition-all active:scale-95 flex items-center gap-1"
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
                              className="py-2 px-3 bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-purple text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-98 transition-all flex items-center gap-2"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {t.checkoutBtn}
                            </a>
                          </div>
                        )}

                        {/* Order Tracking Timeline Card */}
                        {message.orderStatus && (
                          <div className="mt-2 p-4 rounded-xl border border-brand-purple/10 bg-gray-50/50 dark:bg-zinc-800/80 dark:border-zinc-700 flex flex-col gap-3 text-xs text-gray-700 dark:text-zinc-200 max-w-sm shadow-inner">
                            <div className="flex items-center justify-between text-brand-purple dark:text-brand-purple-light font-bold">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Order Status: #{message.orderStatus.id}</span>
                              </div>
                              <span className="text-[10px] bg-brand-purple/10 dark:bg-brand-purple/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-brand-purple dark:text-brand-purple-light">
                                {message.orderStatus.status}
                              </span>
                            </div>
                            
                            {/* Stepper Timeline */}
                            <div className="flex items-center justify-between relative mt-2 px-2">
                              {/* Connector line behind */}
                              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-zinc-700 z-0"></div>
                              
                              {/* Step 1: Placed */}
                              <div className="flex flex-col items-center gap-1 z-10">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-brand-purple text-white ring-4 ring-brand-purple/10 dark:ring-brand-purple/20">
                                  1
                                </div>
                                <span className="text-[8px] font-bold text-gray-500 dark:text-zinc-400">Placed</span>
                              </div>

                              {/* Step 2: Processing */}
                              <div className="flex flex-col items-center gap-1 z-10">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  ["processing", "preparing", "dispatched", "shipped", "delivered", "completed", "ready"].includes(message.orderStatus.status.toLowerCase()) || 
                                  (message.orderStatus.progress && ["processing", "prepared", "dispatched", "delivered"].includes(message.orderStatus.progress.toLowerCase()))
                                    ? "bg-brand-purple text-white ring-4 ring-brand-purple/10 dark:ring-brand-purple/20"
                                    : "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500"
                                }`}>
                                  2
                                </div>
                                <span className="text-[8px] font-bold text-gray-500 dark:text-zinc-400">Process</span>
                              </div>

                              {/* Step 3: Dispatched */}
                              <div className="flex flex-col items-center gap-1 z-10">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  ["dispatched", "shipped", "delivered", "completed"].includes(message.orderStatus.status.toLowerCase()) ||
                                  (message.orderStatus.progress && ["dispatched", "delivered"].includes(message.orderStatus.progress.toLowerCase()))
                                    ? "bg-brand-purple text-white ring-4 ring-brand-purple/10 dark:ring-brand-purple/20"
                                    : "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500"
                                }`}>
                                  3
                                </div>
                                <span className="text-[8px] font-bold text-gray-500 dark:text-zinc-400">Dispatch</span>
                              </div>

                              {/* Step 4: Delivered */}
                              <div className="flex flex-col items-center gap-1 z-10">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  ["delivered", "completed"].includes(message.orderStatus.status.toLowerCase()) ||
                                  (message.orderStatus.progress && ["delivered"].includes(message.orderStatus.progress.toLowerCase()))
                                    ? "bg-brand-purple text-white ring-4 ring-brand-purple/10 dark:ring-brand-purple/20"
                                    : "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500"
                                }`}>
                                  4
                                </div>
                                <span className="text-[8px] font-bold text-gray-500 dark:text-zinc-400">Deliver</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-1 mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700 text-[10px]">
                              <span className="text-gray-400 dark:text-zinc-500">Delivery Date:</span>
                              <span className="text-right font-semibold text-gray-700 dark:text-zinc-300">{message.orderStatus.deliveryDate}</span>
                              
                              {message.orderStatus.recipient && (
                                <>
                                  <span className="text-gray-400 dark:text-zinc-500">Recipient:</span>
                                  <span className="text-right font-semibold text-gray-700 dark:text-zinc-300">
                                    {typeof message.orderStatus.recipient === 'object'
                                      ? `${(message.orderStatus.recipient as any).name || ''} (${(message.orderStatus.recipient as any).phone || ''})`
                                      : message.orderStatus.recipient}
                                  </span>
                                </>
                              )}

                              {(message.orderStatus.hasDeliveryPhoto || message.orderStatus.hasDeliveryVideo) && (
                                <>
                                  <span className="text-gray-400 dark:text-zinc-500">Proof:</span>
                                  <span className="text-right text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {message.orderStatus.hasDeliveryPhoto && "Photo"}
                                    {message.orderStatus.hasDeliveryPhoto && message.orderStatus.hasDeliveryVideo && " & "}
                                    {message.orderStatus.hasDeliveryVideo && "Video"} Available
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <span className={`text-[8px] mt-1 text-right ${message.role === "user" ? "text-purple-200" : "text-gray-400"}`}>
                          {typeof message.timestamp === "string"
                            ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Skeletons */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl rounded-tl-none p-4 w-48 flex flex-col gap-2">
                      <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse w-3/4"></div>
                      <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse w-1/2"></div>
                      <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse w-5/6"></div>
                    </div>
                  </div>
                )}
                {isSearching && (
                  <div className="flex flex-col gap-2 justify-start items-start">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-purple dark:text-brand-purple-light animate-pulse">
                      <Search className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching live Kapruka catalog...</span>
                    </div>
                    <div className="flex gap-4 overflow-hidden w-full">
                      {[...Array(2)].map((_, idx) => (
                        <div key={idx} className="min-w-[180px] rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-col gap-3">
                          <div className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
                          <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse w-2/3"></div>
                          <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Anchored bottom input block */}
            <div className="border-t border-gray-100 dark:border-zinc-900 p-4 bg-white dark:bg-zinc-950 z-10 shrink-0">
              <div className="max-w-2xl mx-auto w-full flex flex-col gap-2">
                {renderInputBox()}
                
                {/* Suggestions pill tabs inside chat */}
                <div className="flex gap-2 justify-center mt-1 flex-wrap">
                  {(["browse", "gifts", "delivery"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCommandCategory(activeCommandCategory === cat ? null : cat)}
                      className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                        activeCommandCategory === cat
                          ? "bg-brand-purple/10 dark:bg-brand-purple/20 border-brand-purple/20 text-brand-purple dark:text-brand-purple-light"
                          : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700"
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
          <>
            {/* Backdrop overlay on mobile screens */}
            <div 
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-15 md:hidden"
              onClick={() => setIsCartOpen(false)}
            />
            
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full bg-white dark:bg-zinc-950 border-l border-gray-100 dark:border-zinc-900 flex flex-col z-20 shadow-lg absolute right-0 top-0 md:relative w-full max-w-[320px] sm:max-w-[350px] md:max-w-none shrink-0"
            >
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-800 dark:text-zinc-200">
                <ShoppingCart className="w-4 h-4 text-brand-purple" />
                <span>{t.cartTitle}</span>
                <span className="bg-brand-purple/10 text-brand-purple text-[10px] px-2 py-0.5 rounded-full border border-brand-purple/10 dark:border-brand-purple/20">
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
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cart List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
                  <ShoppingCart className="w-7 h-7 stroke-1 text-gray-300 dark:text-zinc-600" />
                  <p className="text-xs">{t.emptyCart}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl flex flex-col gap-2.5 shadow-sm">
                      <div className="flex gap-2.5">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-zinc-800 overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold truncate text-gray-800 dark:text-zinc-200">{item.title}</h4>
                          <p className="text-xs font-black text-brand-purple mt-0.5">Rs. {item.price.toLocaleString()}</p>
                          
                          {/* Quantity adjustments */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="text-gray-400 hover:text-brand-purple transition-colors"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-gray-400 hover:text-brand-purple transition-colors"
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
                            className="rounded border-gray-300 bg-white text-brand-purple focus:ring-0 focus:ring-offset-0 w-3 h-3"
                          />
                          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-brand-purple" />
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
                              className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-700 placeholder-gray-300 focus:border-brand-purple outline-none"
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
                    <MapPin className="w-3.5 h-3.5 text-brand-purple" />
                    Delivery Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Recipient Name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-purple outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Recipient Phone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-purple outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street Address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-purple outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-purple outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="District"
                        value={deliveryDistrict}
                        onChange={(e) => setDeliveryDistrict(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 placeholder-gray-400 focus:border-brand-purple outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1.5 active:scale-97 transition-all"
                    >
                      <Truck className="w-3.5 h-3.5 text-brand-purple" />
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
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-200 text-brand-purple">
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
                    className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Prepare Pay Link
                  </button>
                )}
              </div>
            )}
          </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper renderer: Prompt input box matching user template style
  function renderInputBox() {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-4 max-w-2xl mx-auto">
        <div className="p-4 flex items-center bg-white dark:bg-zinc-900">
          <input
            ref={inputRef}
            type="text"
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="w-full text-gray-700 dark:text-zinc-100 text-sm outline-none placeholder:text-gray-400 bg-white dark:bg-zinc-900"
          />
        </div>

        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pb-3 bg-white dark:bg-zinc-900">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 py-1 px-2 rounded-md border border-gray-200 dark:border-zinc-700"
                >
                  <FileText className="w-3 h-3 text-brand-purple" />
                  <span className="text-[10px] text-gray-700 dark:text-zinc-200 font-bold">{file}</span>
                  <button
                    onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-350"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button bar */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchEnabled(!searchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                searchEnabled
                  ? "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setDeepResearchEnabled(!deepResearchEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                deepResearchEnabled
                  ? "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={deepResearchEnabled ? "text-brand-purple" : "text-gray-400"}
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
                  ? "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Reason</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2 transition-all rounded-full flex items-center justify-center ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-md"
                  : "text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200"
              }`}
              title={isListening ? "Listening..." : "Start voice input"}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                inputValue.trim()
                  ? "bg-brand-purple text-white hover:bg-brand-purple-light"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Upload file drawer link */}
        <div className="px-4 py-2 border-t border-gray-50 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <button
            onClick={handleUploadFile}
            className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-[11px] hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
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
                    className="w-1.5 h-1.5 bg-brand-purple rounded-full"
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t.suggestionsHeader}
                </h3>
              </div>
              <ul className="divide-y divide-gray-150 dark:divide-zinc-800">
                {commandSuggestions[activeCommandCategory as keyof typeof commandSuggestions].map(
                  (suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleCommandSelect(suggestion)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors duration-75 text-xs text-gray-700 dark:text-zinc-300 flex items-center gap-2.5 font-medium"
                    >
                      {activeCommandCategory === "browse" ? (
                        <Search className="w-3.5 h-3.5 text-brand-purple" />
                      ) : activeCommandCategory === "gifts" ? (
                        <Gift className="w-3.5 h-3.5 text-brand-purple" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-brand-purple" />
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
        isActive ? "bg-brand-purple/10 border-brand-purple/20 shadow-sm" : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`${isActive ? "text-brand-purple" : "text-gray-400"}`}>{icon}</div>
      <span className={`text-[11px] font-bold tracking-wide ${isActive ? "text-brand-purple" : "text-gray-500"}`}>
        {label}
      </span>
    </motion.button>
  );
}
