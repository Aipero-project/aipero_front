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

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export default function Dialogue() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Bonjour! Comment puis-je vous aider?", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Style pour l'animation des points
  const loadingDotsStyle = `
    @keyframes blink {
      0% { opacity: .2; }
      20% { opacity: 1; }
      100% { opacity: .2; }
    }
    .loading span {
      animation-name: blink;
      animation-duration: 1.4s;
      animation-iteration-count: infinite;
      animation-fill-mode: both;
    }
    .loading span:nth-child(2) {
      animation-delay: .2s;
    }
    .loading span:nth-child(3) {
      animation-delay: .4s;
    }
  `;

  // Fonction pour interagir avec LM Studio
  const fetchAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const requestBody = {
        model: "mistral-7b-instruct-v0.3:2",
        messages: [
          {
            role: "assistant",
            content:
              "Bonjour! Je suis un assistant amical qui répond toujours en français. Comment puis-je vous aider?",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        stream: false,
      };

      console.log("Envoi de la requête:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        "http://127.0.0.1:1234/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Réponse d'erreur LM Studio:", errorText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Réponse reçue:", JSON.stringify(data, null, 2));

      return (
        data.choices?.[0]?.message?.content ||
        "Désolé, je n'ai pas pu générer de réponse."
      );
    } catch (error) {
      console.error("Erreur API LM Studio :", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        return "Erreur de connexion : impossible de contacter LM Studio. Vérifiez que :\n1. LM Studio est en cours d'exécution\n2. Le serveur API est démarré (bouton 'Start Server')\n3. Le serveur écoute bien sur http://127.0.0.1:1234";
      }
      return "Erreur : impossible de contacter LM Studio. Assurez-vous que le serveur est en cours d'exécution sur le port 1234 et que le modèle Mistral est bien chargé.";
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const newMessage: Message = { id: Date.now(), text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setIsLoading(true);

    // Récupérer la réponse de l'IA via LM Studio
    const aiResponse = await fetchAIResponse(input);
    const aiMessage: Message = {
      id: Date.now() + 1,
      text: aiResponse,
      sender: "ai",
    };
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
    setIsLoading(false);
  };

  // Défilement automatique vers le bas lors de l'ajout d'un message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen p-4">
      <style>{loadingDotsStyle}</style>
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
          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar fallback="AI" />
              <ChatBubbleMessage variant="received">
                <div className="loading">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </ChatBubbleMessage>
            </ChatBubble>
          )}
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
            disabled={isLoading}
          />
          <div className="flex items-center p-3 pt-0">
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <Mic className="size-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>
            <Button
              size="sm"
              className="ml-auto gap-1.5"
              type="submit"
              disabled={isLoading}
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
