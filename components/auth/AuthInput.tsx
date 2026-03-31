"use client";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = ({ label, error, ...props }: AuthInputProps) => {
  return (
    <div className="space-y-1.5 w-full mb-4">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 outline-none
          ${error 
            ? "border-red-400 dark:border-red-500/50 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 placeholder-red-300 dark:placeholder-red-600" 
            : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/10 placeholder-gray-400 dark:placeholder-gray-500"
          }
          bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm text-gray-900 dark:text-white
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
