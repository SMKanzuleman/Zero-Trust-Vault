import React from 'react';

const Status = () => {
  const statuses = [
    { label: 'Encryption Engine', status: 'Active', color: 'bg-green-500' },
    { label: 'Integrity Checks', status: 'Enabled', color: 'bg-green-500' },
    { label: 'Authentication', status: 'JWT Secure', color: 'bg-accent' },
    { label: 'OpenSSL Layer', status: 'Running', color: 'bg-green-500' },
  ];

  return (
    <section className="py-[80px]">
      <h2 className="text-center mb-[50px] text-[2.2rem] font-bold tracking-tight">System Status</h2>
      
      <div className="max-w-[600px] mx-auto bg-surface border border-border p-[32px]">
        {statuses.map((item, index) => (
          <div 
            key={item.label} 
            className={`flex justify-between items-center py-5 ${index !== statuses.length - 1 ? 'border-b border-border/70' : ''}`}
          >
            <span className="text-muted font-medium">{item.label}</span>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
              <strong className="font-bold text-text tracking-wider uppercase text-xs">{item.status}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Status;
