"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@/components/ui/button";
import { CornerDownLeft, Mic, Paperclip } from "lucide-react";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";

export default function Dialogue() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you?", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Fonction pour interagir avec LM Studio
  const fetchAIResponse = async (userMessage) => {
    try {
      const response = await fetch("http://localhost:1234/v1/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral", // Remplace par ton modèle (ex: "mistral", "llama3", etc.)
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: userMessage },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response from AI.";
    } catch (error) {
      console.error("Erreur API LM Studio :", error);
      return "Erreur : impossible de contacter LM Studio.";
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const newMessage = { id: Date.now(), text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");

    // Récupérer la réponse de l'IA via LM Studio
    const aiResponse = await fetchAIResponse(input);
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Date.now() + 1, text: aiResponse, sender: "ai" },
    ]);
  };

  // Défilement automatique vers le bas lors de l'ajout d'un message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-auto">
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                fallback={message.sender === "user" ? "US" : "AI"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.text}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
          <div ref={messagesEndRef} />
        </ChatMessageList>
      </div>
      <div className="sticky bottom-0 bg-background p-4 border-t">
        <form
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          onSubmit={handleSendMessage}
        >
          <ChatInput
            placeholder="Type your message here..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex items-center p-3 pt-0">
            <Button variant="ghost" size="icon">
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Mic className="size-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>
            <Button size="sm" className="ml-auto gap-1.5" type="submit">
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
