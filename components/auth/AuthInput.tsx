"use client";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = ({ label, error, ...props }: AuthInputProps) => {
  return (
    <div className="space-y-1.5 w-full mb-4">
      <label className="text-sm font-semibold text-gray-700 ml-1">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 outline-none
          ${error 
            ? "border-red-400 focus:ring-4 focus:ring-red-100 placeholder-red-300" 
            : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder-gray-400"
          }
          bg-white/50 backdrop-blur-sm shadow-sm
        `}
      />
      {error && (
        <span className="text-xs font-medium text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};
