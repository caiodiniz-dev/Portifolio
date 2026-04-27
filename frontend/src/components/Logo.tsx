import React from 'react';

interface Props { size?: number; showText?: boolean; className?: string; src?: string; altText?: string }

export const Logo: React.FC<Props> = ({ size = 36, showText = true, className = '', src, altText }) => (
  <div className={`flex items-center gap-2.5 ${className}`} data-testid="finix-logo">
    <div
      className="relative rounded-xl overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={src || "/logo.png"} alt={altText || "Finix logo"} className="w-full h-full object-cover" />
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
