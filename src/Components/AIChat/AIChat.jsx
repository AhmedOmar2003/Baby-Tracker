'use client';
import { useState, useRef, useEffect } from 'react';
import './AIChat.css';
import { MdSend, MdClose, MdSmartToy } from 'react-icons/md';
import axios from 'axios';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Temporarily disabled Gemini API as requested
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'عفواً، ميزة المحادثة الذكية معطلة حالياً بناءً على طلبك. (الذكاء الاصطناعي قيد التحديث وسيتم تفعيله لاحقاً)',
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="ai-chat-container">
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <MdSmartToy />
          <span>Ask about Health & Baby Growth</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window" ref={chatContainerRef}>
          <div className="chat-header">
            <h3>Health & Baby Growth Assistant</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              <MdClose />
            </button>
          </div>

          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 Hello! I'm your health and baby growth assistant.</p>
                <p>Feel free to ask me questions about:</p>
                <ul>
                  <li>Baby development milestones</li>
                  <li>Health and nutrition</li>
                  <li>Common health concerns</li>
                  <li>Growth patterns</li>
                </ul>
                <p>Remember, I provide general information only. Always consult healthcare professionals for specific medical advice.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about health or baby growth..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              <MdSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChat; 