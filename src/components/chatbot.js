// WARNING:
// The API Key is exposed in the frontend code for development purposes only. 
// Exposing API Keys in the frontend is insecure and should be avoided in production. 
// For final deployment, move the API Key to a backend server to securely handle API requests.
// The backend should manage the API key and ensure no unauthorized access to the key.


import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatbot.css';

const Chatbot = () => {
  // State for controlling the visibility of the chatbot window
  const [isOpen, setIsOpen] = useState(false);

  // State to store the chat messages (user and bot)
  const [messages, setMessages] = useState([
    { text: "Hello! I'm THE SOP AI. How can I help you today with store procedures?", sender: 'bot' }
  ]);

  // State for capturing the user's input in the chatbox
  const [inputValue, setInputValue] = useState('');

  // State to manage whether the bot is typing a response
  const [isTyping, setIsTyping] = useState(false);

  // State to store the fetched SOP data for context in conversations
  const [sopData, setSopData] = useState(null);

  // Reference to scroll to the bottom of the chat whenever a new message is added
  const messagesEndRef = useRef(null);

  // API key for communicating with the Gemini API (to be replaced in production)
  const apiKey = "AIzaSyAo5UToedOeYTWia-YIwHpoFDvtaCahZds";

  // Automatically scrolls to the bottom of the chat whenever a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetches the SOP data from the 'output/content.json' file to provide context for the chatbot's responses
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

  // Toggles the visibility of the chatbot interface when the user clicks the button
  const toggleChat = () => setIsOpen(prev => !prev);

  // Handles sending the user's message to the Gemini API for processing and generating a response
  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    // Show user message in the chat window
    const userMessage = { text: trimmedInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Send the user's question to Gemini API for a response
    await sendToGemini(trimmedInput);
  };

  // Handles pressing the Enter key to send the message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Sends the user's query along with the SOP context to the Gemini API and updates the chat with the response
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

      // Extracts the bot's response from the Gemini API
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Sorry, I had trouble answering that. Try again later.";

      // Update the chat with the bot's response
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
