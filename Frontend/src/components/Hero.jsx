import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Database, FileKey, ShieldCheck } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative text-center pt-[120px] pb-[90px] group overflow-hidden"
    >
      {/* Base Grid Background (Visible everywhere) */}
      <div 
        className="absolute inset-0 -z-30 bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)] bg-[size:32px_32px] opacity-100"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        }}
      ></div>
      
      {/* Mouse Follow Spotlight Grid Background */}
      <div 
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)] bg-[size:32px_32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          WebkitMaskImage: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)`,
          maskImage: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)`,
        }}
      ></div>

      {/* Floating Icons */}
      <div className="absolute top-[20%] left-[10%] hidden lg:block animate-[float_6s_ease-in-out_infinite] opacity-40">
        <Shield size={48} className="text-purple-500" strokeWidth={1.5} />
      </div>
      <div className="absolute top-[60%] left-[15%] hidden lg:block animate-[float_8s_ease-in-out_infinite_1s] opacity-30">
        <Key size={36} className="text-amber-500" strokeWidth={1.5} />
      </div>
      <div className="absolute top-[15%] right-[12%] hidden lg:block animate-[float_7s_ease-in-out_infinite_2s] opacity-40">
        <Lock size={40} className="text-emerald-500" strokeWidth={1.5} />
      </div>
      <div className="absolute top-[55%] right-[8%] hidden lg:block animate-[float_9s_ease-in-out_infinite_0.5s] opacity-30">
        <Database size={44} className="text-blue-500" strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-[10%] left-[25%] hidden lg:block animate-[float_7.5s_ease-in-out_infinite_1.5s] opacity-20">
        <FileKey size={32} className="text-rose-500" strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-[15%] right-[25%] hidden lg:block animate-[float_6.5s_ease-in-out_infinite_2.5s] opacity-20">
        <ShieldCheck size={38} className="text-cyan-500" strokeWidth={1.5} />
      </div>
      
      <div className="inline-block bg-accent-light text-accent py-1.5 px-3 rounded-full text-[13px] mb-[20px]">
        Secure File Encryption System
      </div>
      
      <h1 className="text-[2.4rem] md:text-[3.6rem] leading-[1.1] tracking-[-2px] max-w-[900px] mx-auto font-bold">
        Store Files Without Trusting Storage
      </h1>
      
      <p className="max-w-[650px] mx-auto mt-[20px] text-muted text-[1.05rem] leading-relaxed">
        Every file is encrypted before storage using <span className="inline-block bg-surface border border-border shadow-sm text-text font-mono text-sm px-2 py-0.5 rounded-[6px] animate-[pulse_3s_ease-in-out_infinite]">AES-256</span>. 
        Integrity is verified with <span className="inline-block bg-surface border border-border shadow-sm text-text font-mono text-sm px-2 py-0.5 rounded-[6px] animate-[pulse_3s_ease-in-out_infinite_400ms]">SHA-256</span>. 
        Access is controlled with <span className="inline-block bg-surface border border-border shadow-sm text-text font-mono text-sm px-2 py-0.5 rounded-[6px] animate-[pulse_3s_ease-in-out_infinite_800ms]">JWT authentication</span>.
      </p>
      
      <div className="mt-[40px] flex flex-col md:flex-row gap-4 justify-center relative z-10">
        <Link to="/login" className="bg-accent text-white font-semibold py-4 px-8 border-2 border-accent rounded-[10px] hover:bg-accent/90 transition-colors duration-200">
          ACCESS VAULT
        </Link>
        <a href="#how-it-works" className="bg-black text-white font-semibold py-4 px-8 border-2 border-text rounded-[10px] hover:bg-text hover:text-white transition-colors duration-200">
          VIEW ARCHITECTURE
        </a>
      </div>
    </section>
  );
};

export default Hero;
