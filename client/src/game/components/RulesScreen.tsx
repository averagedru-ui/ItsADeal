import React from 'react';
import { motion } from 'framer-motion';

interface RulesScreenProps {
  onBack: () => void;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800 active:bg-gray-700 text-gray-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-lg">Rules</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Section title="Objective" icon="🏆">
          <p>Be the first player to collect <span className="text-yellow-400 font-bold">3 complete property sets</span> of different colors.</p>
        </Section>

        <Section title="Turn Structure" icon="🔄">
          <ol className="list-decimal list-inside space-y-1.5">
            <li><span className="text-indigo-300 font-semibold">Draw</span> - Draw 2 cards from the draw pile</li>
            <li><span className="text-indigo-300 font-semibold">Play</span> - Play up to 3 cards (any combination)</li>
            <li><span className="text-indigo-300 font-semibold">Discard</span> - If you have more than 7 cards, discard down to 7</li>
          </ol>
        </Section>

        <Section title="Card Types" icon="🃏">
          <div className="space-y-3">
            <CardType color="from-emerald-700 to-emerald-900" name="Money Cards" desc="Bank these for value. They can also be used to pay rent or debts." />
            <CardType color="from-blue-500 to-blue-700" name="Property Cards" desc="Place on the table to build sets. Each color needs a specific number of cards to complete." />
            <CardType color="from-yellow-400 to-yellow-600" name="Wild Cards" desc="Can count as either of the colors shown. Place on any matching set." textDark />
            <CardType color="from-purple-500 to-purple-700" name="Action Cards" desc="Special cards that let you collect rent, steal properties, or block attacks." />
          </div>
        </Section>

        <Section title="Action Cards" icon="⚡">
          <div className="space-y-2">
            <ActionRow icon="🎯" name="Pass Go" desc="Draw 2 extra cards" />
            <ActionRow icon="💰" name="Debt Collector" desc="Force one player to pay you $5M" />
            <ActionRow icon="🎂" name="Birthday" desc="All players pay you $2M each" />
            <ActionRow icon="🏠" name="Rent" desc="Charge rent on a property color you own" />
            <ActionRow icon="🏘️" name="Wild Rent" desc="Charge rent on any color you choose" />
            <ActionRow icon="🤏" name="Sly Deal" desc="Steal one property from an opponent (not from a complete set)" />
            <ActionRow icon="🔄" name="Forced Deal" desc="Swap one of your properties with an opponent's" />
            <ActionRow icon="💎" name="Deal Breaker" desc="Steal an entire complete set from an opponent" />
            <ActionRow icon="🚫" name="Just Say No" desc="Block any action played against you" />
            <ActionRow icon="🏡" name="House" desc="Add to a complete set to increase rent" />
            <ActionRow icon="🏨" name="Hotel" desc="Add to a set with a house for max rent" />
            <ActionRow icon="⚡" name="Double Rent" desc="Double the rent you charge this turn" />
          </div>
        </Section>

        <Section title="Paying Debts" icon="💵">
          <p>When you owe money, you can pay with:</p>
          <ul className="list-disc list-inside mt-1.5 space-y-1">
            <li>Money cards from your bank</li>
            <li>Property cards from your sets</li>
            <li>You don't get change back</li>
          </ul>
        </Section>

        <Section title="Hand Limit" icon="✋">
          <p>At the end of your turn, if you have more than <span className="text-red-400 font-bold">7 cards</span> in your hand, you must discard down to 7.</p>
        </Section>

        <Section title="Winning" icon="👑">
          <p>The first player to have <span className="text-yellow-400 font-bold">3 complete property sets</span> on the table wins! Each set must be a different color.</p>
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40"
  >
    <h2 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    <div className="text-gray-300 text-[13px] leading-relaxed">{children}</div>
  </motion.div>
);

const CardType: React.FC<{ color: string; name: string; desc: string; textDark?: boolean }> = ({ color, name, desc, textDark }) => (
  <div className="flex items-start gap-2.5">
    <div className={`w-8 h-10 rounded-lg bg-gradient-to-br ${color} border border-white/20 flex-shrink-0`} />
    <div>
      <p className="text-white text-xs font-bold">{name}</p>
      <p className="text-gray-400 text-[11px]">{desc}</p>
    </div>
  </div>
);

const ActionRow: React.FC<{ icon: string; name: string; desc: string }> = ({ icon, name, desc }) => (
  <div className="flex items-start gap-2">
    <span className="text-sm flex-shrink-0">{icon}</span>
    <div>
      <span className="text-white text-xs font-semibold">{name}</span>
      <span className="text-gray-400 text-[11px]"> - {desc}</span>
    </div>
  </div>
);
