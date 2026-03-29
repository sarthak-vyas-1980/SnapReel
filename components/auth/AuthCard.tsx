"use client";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export const AuthCard = ({ children, title, subtitle, className = "" }: AuthCardProps) => {
  return (
    <div className={`w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 ${className}`}>
      {/* Background gradients for extra polish */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            {subtitle}
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
};
