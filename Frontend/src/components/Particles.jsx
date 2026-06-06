import React, { useMemo } from 'react';

const Particles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1.5, // 1.5px to 3.5px
      duration: Math.random() * 8 + 10, // 10s to 18s (faster movement)
      delay: Math.random() * -20,
      xMove: (Math.random() - 0.5) * 80, // larger natural movement
      yMove: (Math.random() - 0.5) * 80,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]">
      {/* Inner container that scales on hover to spread particles */}
      <div className="w-full h-full transform transition-transform duration-[2000ms] ease-out group-hover:scale-[1.6]">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#d1d5db]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--x-move': `${p.xMove}px`,
              '--y-move': `${p.yMove}px`,
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Particles;
