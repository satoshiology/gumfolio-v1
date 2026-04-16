import * as React from "react";
import { Sparkles, Send, Bot, Zap, BrainCircuit, MessageSquare, Loader2, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { AudioHandler } from "@/src/lib/audio-utils";

export default function AIAgent() {
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLiveSessionActive, setIsLiveSessionActive] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "assistant", content: "Greetings, Creator. I am your Luminous Intelligence. How can I assist with your digital empire today?" }
  ]);

  const chatRef = React.useRef<any>(null);
  const audioHandler = React.useRef(new AudioHandler());
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-flash-lite-preview",
      config: {
        systemInstruction: "You are Gumfolio's AI Strategist. You help digital creators optimize their Gumroad business. Be concise, professional, and insightful. Responses must be no longer than 2-3 sentences. Use markdown for formatting and always use double newlines (\\n\\n) to separate paragraphs.",
      },
    });
  }, []);

  const toggleLiveSession = async () => {
    if (isLiveSessionActive) {
      // Stop session
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      audioHandler.current.stopRecording();
      setIsLiveSessionActive(false);
    } else {
      // Start session
      setIsLiveSessionActive(true);
      const apiKey = process.env.GEMINI_API_KEY;
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        // Send initial setup message if required by the API
      };

      wsRef.current.onmessage = (event) => {
        // Handle incoming audio data
        const data = JSON.parse(event.data);
        if (data.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
          audioHandler.current.playPcm(data.serverContent.modelTurn.parts[0].inlineData.data);
        }
      };

      await audioHandler.current.startRecording((base64Data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            clientContent: {
              turns: [{
                role: "user",
                parts: [{ inlineData: { mimeType: "audio/pcm", data: base64Data } }]
              }],
              turnComplete: true
            }
          }));
        }
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: input });
      let fullResponse = "";
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
      }
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: fullResponse 
      }]);
    } catch (error) {
      console.error("Chat Error Details:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I encountered a neural glitch: ${error instanceof Error ? error.message : String(error)}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-16rem)]"
    >
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 p-[1px] mb-4 shadow-[0_0_30px_rgba(0,255,65,0.2)]">
          <div className="w-full h-full rounded-[15px] bg-surface-dim flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">AI Strategist</h1>
      </header>

      <div className="flex-1 overflow-hidden">
        <motion.div 
          key="chat"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-y-auto space-y-6 px-2 mb-6 scrollbar-hide">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-primary/20 text-on-surface border border-primary/30 rounded-tr-none" 
                    : "bg-surface-container-high/60 text-on-surface border border-white/5 rounded-tl-none backdrop-blur-md prose prose-invert prose-sm max-w-none"
                )}>
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
                <span className="text-[10px] font-label text-zinc-600 uppercase tracking-widest mt-2 px-1">
                  {msg.role === "user" ? "You" : "Noir Intelligence"}
                </span>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary/60 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-label uppercase tracking-widest">Processing...</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full -z-10 opacity-50"></div>
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
              <button
                onClick={toggleLiveSession}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,255,65,0.4)]",
                  isLiveSessionActive ? "bg-red-500 text-white" : "bg-surface-container-high text-primary hover:bg-surface-container-highest"
                )}
              >
                <Mic className={cn("w-5 h-5", isLiveSessionActive && "animate-pulse")} />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your strategist..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-zinc-600 px-4 py-2 text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <QuickAction icon={Zap} label="Growth Hack" onClick={() => setInput("Give me a growth hack for my Gumroad products.")} />
        <QuickAction icon={BrainCircuit} label="Market Analysis" onClick={() => setInput("Analyze the current digital creator market.")} />
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/40 border border-white/5 hover:bg-surface-container-high transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-label font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{label}</span>
    </button>
  );
}

