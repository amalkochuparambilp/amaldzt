import { motion, AnimatePresence } from 'motion/react';
import { VCReaction } from '../../types';

interface FloatingReactionsProps {
  reactions: VCReaction[];
}

export default function FloatingReactions({ reactions }: FloatingReactionsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 50, scale: 0.5, x: `${r.x}vw` }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -window.innerHeight * 0.7,
              scale: [0.6, 1.4, 1.2, 0.8],
              rotate: [0, -10, 10, -5, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            className="absolute bottom-24 flex flex-col items-center select-none"
          >
            <span className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {r.emoji}
            </span>
            <span className="text-[10px] font-mono font-bold bg-black/80 text-white px-2 py-0.5 rounded-full border border-white/20 mt-1 shadow-md whitespace-nowrap">
              {r.senderName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
