import React from 'react';

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse" 
        style={{ animationDuration: '8s' }} 
      />
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse" 
        style={{ animationDuration: '10s', animationDelay: '2s' }} 
      />
      <div 
        className="absolute top-[20%] right-[15%] w-[25rem] h-[25rem] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" 
        style={{ animationDuration: '7s', animationDelay: '4s' }} 
      />
      
      <div className="z-10 w-full">
        {children}
      </div>
    </div>
  );
}
