import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Star, Trophy } from "lucide-react";

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
}

export const ConfettiEffect = (
  { active, duration = 5000 }: ConfettiEffectProps,
) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  const particleCount = 50;
  const particles = Array.from({ length: particleCount });

  // Generate random values for each particle
  const getParticles = () => {
    return particles.map((_, i) => {
      const x = Math.random() * 100;
      const y = -10 - Math.random() * 40;
      const size = 10 + Math.random() * 20;
      const delay = Math.random() * 0.2;
      const duration = 1 + Math.random() * 2;
      const rotate = Math.random() * 360;

      // Alternate between different icons that exist in lucide-react
      const IconComponent = i % 3 === 0 ? Star : i % 3 === 1 ? Award : Trophy;

      const color = i % 3 === 0
        ? "text-yellow-500"
        : i % 3 === 1
        ? "text-indigo-500"
        : "text-rose-500";

      return { x, y, size, delay, duration, rotate, IconComponent, color };
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {getParticles().map((particle, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                y: "110vh",
                rotate: particle.rotate,
                opacity: [1, 1, 0.8, 0.6, 0],
                scale: [1, 1.2, 1, 0.8, 0.6],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
            >
              <particle.IconComponent
                size={particle.size}
                className={`${particle.color}`}
              />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
