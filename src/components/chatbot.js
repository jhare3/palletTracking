import React, { useState, useRef, useEffect } from 'react';
import './chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hey there, I'm your productivity pal! ✌️ How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    const val = inputValue.trim();
    if (!val || isTyping) return;
    
    // Add user message
    const userMessage = { text: val, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      // Call Gemini API
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBPk4NYw_5enfX5-OJxYN14haaxFoQxiPM",
        {
          method: "POST",
          body: JSON.stringify({
            contents: [
              {
                parts: [{ 
                  text: `Respond to the user query: ${val}\n\nDo NOT use markdown format! Respond from the point of view of a chill and professional co-worker. Don’t ever respond with any more than 2 sentences. Only respond in plain text with NO formatting. Respond in short, readable messages. The user is working on unprocessed pallet survey for their job. This survey requires entries for remaining pallets, cartons processed, CPH, ZPH, and pallets delivered. The specialized calculator they are using will do the calculations for them as long as they have data for carried-over pallets, remaining pallets, pallets delivered, hours hanging, z-racks filled, and total backroom hours. The user might also wants to chat about general practices for running a backroom at a retail store.` 
                }]
              }
            ]
          })
        }
      );
      
      const data = await response.json();
      const botResponse = data.candidates[0].content.parts[0].text;
      
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        text: "Whoa, like, something went wrong... try again later maybe?", 
        sender: 'bot' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button 
        className="chatbot-toggle"
        onClick={toggleChat}
      >
        {isOpen ? (
          <i className="fas fa-times"></i>
        ) : (
          <>
            <i className="fas fa-robot"></i>
            Ask Productivity Pal
          </>
        )}
      </button>
      
      {isOpen && (
        <div className="chatbot-content">
          <div className="chatbot-header">
            <i className="fas fa-robot"></i>
            Productivity Pal
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {msg.text}
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot-message typing-indicator">
                <i className="fas fa-ellipsis-h"></i>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input-container">
            <div className="chatbot-input-group">
              <input
                type="text"
                className="chatbot-input form-control"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isTyping}
              />
              <button 
                className="chatbot-send-btn"
                onClick={handleSendMessage}
                disabled={isTyping || !inputValue.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;