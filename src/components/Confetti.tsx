"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#5B4FE9", "#8B5CF6", "#7B6DFF", "#EC4899", "#F59E0B", "#10B981", "#0EA5E9"];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    color: COLORS[i % COLORS.length],
    size: 5 + Math.random() * 6,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
  }));
}

/**
 * Full-screen confetti burst. Shows for ~2.5s then auto-hides.
 * Usage: <Confetti trigger={showConfetti} />
 */
function ConfettiComponent({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setParticles(generateParticles(28));
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: "-5vh",
                rotate: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: p.rotation + 360,
                scale: [1, 1.2, 0.6],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 0.8,
                delay: p.delay,
                ease: [0.2, 0, 0.8, 1],
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size * (Math.random() > 0.5 ? 1 : 1.8),
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.4 ? "1px" : "50%",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ConfettiComponent);

/**
 * Milestone toast + confetti combo. Shows a celebration when triggered.
 */
export function MilestoneToast({ show, title, subtitle, onDone }: {
  show: boolean;
  title: string;
  subtitle: string;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <>
      <ConfettiComponent trigger={show} />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9998] px-6 py-4 rounded-2xl text-white text-center max-w-[320px]"
            style={{
              background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
              boxShadow: "0 20px 48px rgba(91,79,233,0.45), 0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <p className="text-[18px]">🎉</p>
            <p className="text-[15px] font-bold mt-1">{title}</p>
            <p className="text-[11px] text-white/80 mt-0.5">{subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
