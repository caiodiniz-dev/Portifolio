import React from 'react';

interface Props { size?: number; showText?: boolean; className?: string }

export const Logo: React.FC<Props> = ({ size = 36, showText = true, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`} data-testid="finix-logo">
    <div
      className="relative rounded-xl overflow-hidden shrink-0"
      style={{
        width: size, height: size,
        boxShadow: '0 6px 20px -6px rgba(37, 99, 235, 0.55)',
      }}
    >
      <img src="/logo.png" alt="Finix logo" className="w-full h-full object-cover" />
    </div>
    {showText && (
      <div className="flex flex-col leading-none">
        <span className="font-display font-extrabold text-[1.25rem] tracking-tight">
          <span className="text-brand-dark dark:text-white">FINI</span>
          <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">X</span>
        </span>
      </div>
    )}
  </div>
);
