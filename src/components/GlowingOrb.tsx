import { motion } from "framer-motion";

interface GlowingOrbProps {
  size?: number;
  onClick?: () => void;
  isActive?: boolean;
  isPulsing?: boolean;
}

const GlowingOrb = ({ size = 240, onClick, isActive = false, isPulsing = true }: GlowingOrbProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative rounded-full focus:outline-none cursor-pointer"
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      aria-label="Start conversation"
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--orb-gold) / 0.3) 0%, hsl(var(--orb-purple) / 0.15) 50%, transparent 70%)",
        }}
        animate={isPulsing ? {
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Middle layer */}
      <motion.div
        className="absolute inset-[10%] rounded-full"
        style={{
          background: "radial-gradient(circle at 40% 35%, hsl(var(--orb-gold) / 0.6) 0%, hsl(var(--orb-purple) / 0.5) 40%, hsl(var(--orb-warm) / 0.3) 70%, transparent 100%)",
        }}
        animate={isPulsing ? {
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Inner orb */}
      <motion.div
        className="absolute inset-[20%] rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, 
            hsl(var(--orb-gold) / 0.9) 0%, 
            hsl(var(--orb-purple) / 0.7) 35%, 
            hsl(var(--orb-warm) / 0.5) 65%, 
            hsl(var(--orb-purple) / 0.3) 100%)`,
          boxShadow: `
            0 0 40px hsl(var(--orb-purple) / 0.3),
            0 0 80px hsl(var(--orb-gold) / 0.15),
            inset 0 0 30px hsl(var(--orb-gold) / 0.2)
          `,
        }}
        animate={isActive ? {
          scale: [1, 1.08, 0.96, 1.04, 1],
        } : isPulsing ? {
          scale: [1, 1.03, 1],
        } : {}}
        transition={isActive ? {
          duration: 0.8, repeat: Infinity, ease: "easeInOut",
        } : {
          duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2,
        }}
      />

      {/* Highlight spot */}
      <div
        className="absolute rounded-full"
        style={{
          width: "30%",
          height: "20%",
          top: "28%",
          left: "28%",
          background: "radial-gradient(ellipse, hsl(0 0% 100% / 0.35) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
    </motion.button>
  );
};

export default GlowingOrb;
