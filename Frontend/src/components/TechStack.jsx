import React from 'react';

const TechStack = () => {
  const stack = [
    { name: 'React', role: 'Client Framework' },
    { name: 'Node.js', role: 'Runtime Environment' },
    { name: 'Express', role: 'RESTful API' },
    { name: 'MongoDB', role: 'Binary Storage' },
    { name: 'OpenSSL', role: 'Core Encryption' },
    { name: 'Tailwind CSS', role: 'UI Architecture' }
  ];

  return (
    <section id="tech-stack" className="my-[120px] max-w-6xl mx-auto px-6 font-sans">
      <div className="text-center mb-[60px]">
        <h2 className="text-[2.2rem] font-bold tracking-tight text-text">Tech Stack</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stack.map((tech, i) => (
          <div 
            key={i} 
            className="group flex flex-col items-center justify-center py-8 px-4 bg-surface border border-border/60 rounded-xl hover:border-accent hover:shadow-lg transition-all duration-300 cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-300">
              <span className="text-accent group-hover:text-white font-bold text-lg">{tech.name.charAt(0)}</span>
            </div>
            <h3 className="text-[1.05rem] font-bold text-text mb-1 text-center group-hover:text-accent transition-colors duration-300">{tech.name}</h3>
            <span className="text-[0.7rem] text-muted font-bold uppercase tracking-wider text-center">{tech.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechStack;
