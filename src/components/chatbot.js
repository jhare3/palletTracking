import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm THE SOP AI. How can I help you today with store procedures?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sopData, setSopData] = useState(null);
  const messagesEndRef = useRef(null);

  const apiKey = "AIzaSyAo5UToedOeYTWia-YIwHpoFDvtaCahZds"; // Replace with your actual key

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch SOP context JSON from public folder
  useEffect(() => {
    const fetchSopData = async () => {
      try {
        const response = await fetch('output/content.json');
        const data = await response.json();
        setSopData(data);
      } catch (error) {
        console.error('Error fetching SOP data:', error);
        setMessages(prev => [...prev, {
          text: "Error: I couldn't load the SOP data. Please check back later.",
          sender: 'bot'
        }]);
      }
    };

    fetchSopData();
  }, []);

  const toggleChat = () => setIsOpen(prev => !prev);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    // Show user message
    const userMessage = { text: trimmedInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    await sendToGemini(trimmedInput);
  };

  // Pressing Enter sends the message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // send to gemini function
  const sendToGemini = useCallback(async (userQuestion) => {
    try {
      const context = sopData ? JSON.stringify(sopData) : 'No SOP data available';
      console.log("SOP Context:", context);
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Respond to the user query: ${userQuestion}\n\nI need you to become an expert on everything in this document. I would like to quiz you on the ask you questions about details in the document and i need you to be able to speak about it at a high level. SOP Context: ${context}\n\nDo NOT use markdown format! Respond from the point of view of a super genius store manager. NO JOKES, NO RELATABLE STORIES, NO HALLUCINATIONS. Only respond in plain text. Keep it short, useful, and professional.`
              }]
            }]
          })
        }
      );
  
      const data = await response.json();
      console.log("Gemini API raw response:", data);
  
      if (data.error) {
        console.error("Gemini API error:", data.error);
        throw new Error(data.error.message);
      }
  
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Sorry, I had trouble answering that. Try again later.";
  
      setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
    } catch (error) {
      console.error("Gemini API error (caught):", error);
      setMessages(prev => [...prev, {
        text: "Sorry, something went wrong while talking to Gemini. Please try again later.",
        sender: 'bot'
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [sopData]);
  

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button className="chatbot-toggle" onClick={toggleChat}>
        {isOpen ? <i className="fas fa-times"></i> : <>
          <i className="fas fa-robot"></i> Ask Productivity Pal
        </>}
      </button>

      {isOpen && (
        <div className="chatbot-content">
          <div className="chatbot-header">
            <i className="fas fa-robot"></i> Productivity Pal
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
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
