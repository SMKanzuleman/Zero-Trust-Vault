import React from 'react';

const Developers = () => {
  const devs = [
    { name: "M.Salman Haider", role: "Frontend Developer" },
    { name: "S.Kanzul Eman", role: "Backend Developer" },
    { name: "Moin ALi", role: "Cryptography Specialist" }
  ];

  return (
    <section id="team" className="py-[100px] text-center border-t border-border">
      <div className="inline-block bg-accent-light text-accent py-1.5 px-3 rounded-full text-[13px] mb-[20px] font-medium">
        The Creators
      </div>
      <h2 className="text-[2.2rem] font-bold mb-4">Meet The Developers</h2>
      <p className="text-muted mb-[60px] max-w-[600px] mx-auto">
        Built by security-focused engineers to ensure your data remains yours alone.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1000px] mx-auto px-4">
        {devs.map((dev, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-[15px] p-8 hover:-translate-y-2 transition-transform duration-300 shadow-sm text-center">
            <h3 className="text-xl font-bold">{dev.name}</h3>
            <p className="text-accent font-medium mt-1 text-sm">{dev.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Developers;
