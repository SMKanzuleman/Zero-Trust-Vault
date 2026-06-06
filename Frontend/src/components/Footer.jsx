import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border mt-24 py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="text-accent" size={24} />
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            ZERO-TRUST VAULT
          </span>
        </div>
        
        <div className="flex gap-6 text-sm text-muted">
          <a href="#how-it-works" onMouseEnter={() => document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-accent transition-colors">How it Works</a>
          <Link to="/login" className="hover:text-accent transition-colors">Sign In</Link>
          <a href="#team" onMouseEnter={() => document.getElementById('team')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-accent transition-colors">Team</a>
          <a href="#tech-stack" onMouseEnter={() => document.getElementById('tech-stack')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-accent transition-colors">Tech Stack</a>
        </div>
        
        <div className="text-sm text-muted">
          &copy; {new Date().getFullYear()} Zero-Trust Vault. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
