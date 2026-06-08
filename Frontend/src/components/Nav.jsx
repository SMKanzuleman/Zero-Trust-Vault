import React from 'react';
import { Link } from 'react-router-dom';

const Nav = () => {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center py-[22px] bg-[#f7f7f5]/80 backdrop-blur-md border-b border-border/40 -mx-4 px-4 sm:mx-0 sm:px-0">
      <Link to="/" className="font-black tracking-widest text-accent text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>CIPHERNEST</Link>
      <div className="flex gap-4 items-center">
        <Link to="/signup" className="text-text hover:text-muted transition-colors font-semibold">Sign Up</Link>
        <Link to="/login" className="border border-border py-2 px-4 rounded-[10px] text-text hover:bg-border/50 transition-colors font-semibold shadow-sm">Sign In</Link>
      </div>
    </nav>
  );
};

export default Nav;
