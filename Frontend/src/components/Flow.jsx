import React from 'react';

const Flow = () => {
  const steps = ['Upload', 'Encrypt', 'Store', 'Verify', 'Download'];
  
  return (
    <section id="how-it-works" className="py-[80px]">
      <h2 className="text-center mb-[80px] text-[2.2rem] font-bold tracking-tight">How It Works</h2>
      
      <div className="relative max-w-[800px] mx-auto py-4">
        {/* The continuous vertical line (left on mobile, center on desktop) */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2"></div>
        
        <div className="flex flex-col gap-12">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={step} className="relative flex items-center w-full group cursor-default">
                
                {/* The circular node on the timeline */}
                <div className="absolute left-6 md:left-1/2 top-1/2 w-[22px] h-[22px] rounded-full bg-surface border-2 border-border flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10 group-hover:border-accent transition-all duration-300">
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-accent transition-colors duration-300"></div>
                </div>
                
                {/* The text content */}
                <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'md:pr-14 md:text-right md:ml-0' : 'md:pl-14 md:text-left md:ml-auto'}`}>
                  <div className={`transform transition-transform duration-300 ${isEven ? 'group-hover:translate-x-2 md:group-hover:-translate-x-2' : 'group-hover:translate-x-2'}`}>
                    <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase block mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      STEP {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[1.5rem] font-bold tracking-tight text-text">{step}</span>
                    <p className={`text-muted text-sm mt-2 max-w-[280px] ${isEven ? 'md:ml-auto' : ''}`}>
                      System automatically processes this phase securely in the background.
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Flow;
