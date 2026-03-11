import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardGame } from '../useCardGame';

export const ActionNotification: React.FC = () => {
  const message = useCardGame(s => s.message);
  const phase = useCardGame(s => s.phase);
  const gameLog = useCardGame(s => s.gameLog);
  const [notifications, setNotifications] = useState<{ id: number; text: string; color: string }[]>([]);
  const lastLogIdRef = useRef(0);
  const lastMessageRef = useRef('');

  // Watch game log for key events to surface as toasts
  useEffect(() => {
    if (!gameLog.length) return;
    const latest = gameLog[gameLog.length - 1];
    if (latest.id <= lastLogIdRef.current) return;
    lastLogIdRef.current = latest.id;

    const msg = latest.message;
    let color = 'border-yellow-500/30 text-yellow-300';

    const isToastWorthy =
      msg.includes('rejected') ||
      msg.includes('accepted the trade') ||
      msg.includes('Just Say No') ||
      msg.includes('stole') ||
      msg.includes('Deal Breaker') ||
      msg.includes('pays $') ||
      msg.includes('charges') ||
      msg.includes('Birthday') ||
      msg.includes('Forced Deal') ||
      msg.includes('added house') ||
      msg.includes('added hotel') ||
      msg.includes('reshuffled') ||
      msg.includes('wins');

    if (!isToastWorthy) return;

    if (msg.includes('rejected')) color = 'border-red-500/40 text-red-300';
    else if (msg.includes('accepted')) color = 'border-green-500/40 text-green-300';
    else if (msg.includes('Just Say No')) color = 'border-purple-500/40 text-purple-300';
    else if (msg.includes('wins')) color = 'border-yellow-400/60 text-yellow-200';

    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev.slice(-2), { id, text: msg, color }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, [gameLog]);

  // Also watch message directly for warning/error states
  useEffect(() => {
    if (!message || message === lastMessageRef.current) return;
    lastMessageRef.current = message;

    if (message.startsWith('⚠️')) {
      const id = Date.now() + Math.random();
      setNotifications(prev => [...prev.slice(-2), { id, text: message.replace('⚠️ ', ''), color: 'border-orange-500/40 text-orange-300' }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    }
  }, [message]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`bg-gray-800/95 backdrop-blur border ${n.color} rounded-xl px-5 py-2.5 shadow-xl shadow-black/30`}
          >
            <span className={`font-semibold text-sm ${n.color.split(' ')[1]}`}>{n.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
