import React from 'react';

const Stats = () => {
  const statsData = [
    { 
      title: 'Authentication', 
      tech: 'JWT & SHA256',
      points: [
        'Stateless session management',
        'No plain text passwords stored',
        'Cryptographically signed tokens'
      ]
    },
    { 
      title: 'AES Encryption', 
      tech: 'OpenSSL CLI',
      points: [
        'File buffers encrypted in-memory',
        'Zero plaintext ever touches disk',
        'Decrypted purely on-the-fly'
      ],
      featured: true
    },
    { 
      title: 'SHA256', 
      tech: 'OpenSSL CLI',
      points: [
        'Hashes generated during upload',
        'Verified against during download',
        'Guarantees absolute file integrity'
      ]
    },
  ];

  const CheckIcon = () => (
    <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <section className="my-[120px] max-w-6xl mx-auto px-6 font-sans">
      <h2 className="text-[2.2rem] font-bold tracking-tight mb-[80px] text-center">Implementation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 items-center max-w-5xl mx-auto px-4 gap-y-6 md:gap-y-0">
        {statsData.map((stat, i) => {
          const isFeatured = stat.featured;
          
          let containerClasses = "group relative flex flex-col bg-surface border transition-all duration-300 ease-out w-full h-full ";
          
          if (isFeatured) {
            containerClasses += "p-10 md:p-12 rounded-[24px] border-accent/30 shadow-[0_20px_60px_rgba(20,159,62,0.1)] z-10 md:scale-105 bg-surface";
          } else {
            containerClasses += "p-8 md:p-10 rounded-[24px] md:rounded-none border-border z-0 hover:-translate-y-1 hover:shadow-xl bg-surface";
            if (i === 0) containerClasses += " md:rounded-l-[24px] md:border-r-0";
            if (i === 2) containerClasses += " md:rounded-r-[24px] md:border-l-0";
          }

          return (
            <div key={i} className={containerClasses}>
              {isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm">
                  Core Engine
                </div>
              )}
              
              <h3 className={`text-[1.8rem] font-bold tracking-tight mb-2 ${isFeatured ? 'text-text' : 'text-text'}`}>
                {stat.title}
              </h3>
              
              <div className="text-accent font-semibold text-lg mb-8 pb-4 border-b border-border/50 group-hover:border-accent/30 transition-colors">
                {stat.tech}
              </div>
              
              <ul className="flex flex-col gap-4">
                {stat.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-3 text-muted text-[0.95rem] transition-colors">
                    <CheckIcon />
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Stats;
