import React from 'react';

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-500">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] bg-primary/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: '15s' }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[45rem] h-[45rem] bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: '20s', animationDelay: '3s' }}
        />
        <div
          className="absolute top-[20%] right-[-5%] w-[30rem] h-[30rem] bg-blue-400/10 dark:bg-blue-300/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '6s' }}
        />
      </div>

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

      <div className="z-10 w-full animate-in fade-in zoom-in duration-700">
        {children}
      </div>
    </div>
  );
}
