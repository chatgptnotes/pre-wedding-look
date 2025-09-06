import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../services/geminiChatService';
import { ChatMessage, OptionUpdate } from '../types';

interface ChatbotProps {
    onMultipleOptionsChange: (updates: OptionUpdate[]) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onMultipleOptionsChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: Date.now(), sender: 'bot', text: "Hi! I'm your AI assistant. I can help set the location, attire, poses, and more. Try saying 'Set the art style to cinematic'." }
            ]);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const botResponse = await getChatbotResponse(inputValue);
            
            if (botResponse.action === 'set_option') {
                // The new ChatbotAction type guarantees 'updates' exists for 'set_option' action.
                // We still check for length > 0 to avoid calling the handler with an empty array.
                if (botResponse.updates.length > 0) {
                    onMultipleOptionsChange(botResponse.updates);
                }
            }

            const botMessage: ChatMessage = { id: Date.now() + 1, sender: 'bot', text: botResponse.responseText };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { id: Date.now() + 1, sender: 'bot', text: "Sorry, I'm having a little trouble right now. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-rose-600 text-white w-16 h-16 rounded-full shadow-lg hover:bg-rose-700 flex items-center justify-center transition-transform transform hover:scale-110"
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all">
            <header className="flex items-center justify-between p-4 bg-rose-50 rounded-t-2xl border-b border-rose-200">
                <h3 className="font-bold text-lg text-rose-900">AI Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="text-stone-500 hover:text-stone-800" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto bg-stone-50">
                <div className="flex flex-col space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                                msg.sender === 'user' 
                                ? 'bg-rose-600 text-white rounded-br-none' 
                                : 'bg-stone-200 text-stone-800 rounded-bl-none'
                            }`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-end justify-start">
                            <div className="px-4 py-2 rounded-2xl max-w-[80%] bg-stone-200 text-stone-800 rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-200 bg-white rounded-b-2xl">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g., Make the groom kneel"
                        className="flex-1 p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        aria-label="Chat input"
                        disabled={isLoading}
                    />
                    <button type="submit" className="p-2 bg-rose-600 text-white rounded-lg disabled:bg-stone-400" aria-label="Send message" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chatbot;