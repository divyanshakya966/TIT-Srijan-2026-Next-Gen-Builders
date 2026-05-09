import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Bot, Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/ai-chat")({ component: AIChatPage });

const SUGGESTED_PROMPTS = [
  "Find books for CSE",
  "Suggest affordable gadgets",
  "Show trending items",
  "Find hostel essentials",
];

interface AIChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

function AIChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      text: "Hi! 👋 I'm your Campus Assistant. I can help you find products, answer questions about the marketplace, and suggest items based on your needs. What are you looking for?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const addMessage = (text: string, sender: "user" | "assistant") => {
    const newMessage: AIChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const callAssistant = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setErrorText("");
    addMessage(trimmed, "user");
    setInput("");
    setIsLoading(true);

    try {
      const token = user ? await user.getIdToken() : "";
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Campus Assistant for a student marketplace. Be concise, practical, safety-aware, and provide actionable suggestions.",
            },
            ...messages.slice(-8).map((message) => ({
              role: message.sender === "user" ? "user" : "assistant",
              content: message.text,
            })),
            { role: "user", content: trimmed },
          ],
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        content?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.content) {
        throw new Error(payload.error || "AI service is currently unavailable.");
      }

      addMessage(payload.content, "assistant");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI service is currently unavailable.";
      setErrorText(message);
      addMessage(
        "I could not process that right now. Please verify the OpenRouter server configuration and try again.",
        "assistant",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    void callAssistant(input);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    void callAssistant(prompt);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Container */}
        <div className="flex w-full flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate({ to: "/chat" })}
                className="rounded-lg p-2 hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Campus Assistant</h2>
                  <p className="text-xs text-muted-foreground">AI Powered • Always available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex gap-3",
                      msg.sender === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.sender === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-xs rounded-lg px-4 py-2 text-sm",
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          msg.sender === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2">
                    <Loader className="h-4 w-4 animate-spin text-secondary-foreground" />
                    <span className="text-sm text-secondary-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested Prompts (only show if few messages) */}
          {messages.length <= 2 && !isLoading && (
            <div className="border-t border-border px-6 py-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Quick suggestions:</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorText ? <div className="px-6 pb-2 text-xs text-destructive">{errorText}</div> : null}

          {/* Input Area */}
          <div className="border-t border-border bg-card px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
