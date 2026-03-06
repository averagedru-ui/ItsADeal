import React, { useState, useRef, useEffect } from 'react';
import { useCardGame } from '../useCardGame';

export const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const chatMessages = useCardGame(s => s.chatMessages);
  const sendChat = useCardGame(s => s.sendChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(chatMessages.length);

  useEffect(() => {
    if (chatMessages.length > prevCountRef.current) {
      if (!isOpen) {
        setUnread(u => u + (chatMessages.length - prevCountRef.current));
      }
    }
    prevCountRef.current = chatMessages.length;
  }, [chatMessages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-2 z-40">
      {isOpen ? (
        <div className="w-64 h-72 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/30 bg-gray-800/60">
            <span className="text-white text-xs font-semibold">Chat</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 active:text-white"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-[10px] text-center mt-6">No messages yet</p>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id}>
                <span className="text-indigo-400 font-semibold text-[10px]">{msg.sender}: </span>
                <span className="text-gray-300 text-[10px] break-words">{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-1.5 border-t border-gray-700/30 flex gap-1">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              maxLength={200}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-gray-800 border border-gray-700/50 text-white text-[11px] placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-3 py-1.5 bg-indigo-600 active:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-[11px] font-bold rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-9 h-9 bg-indigo-600 active:bg-indigo-500 rounded-full shadow-lg flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
