export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-slate-950 p-16 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs font-bold tracking-wider text-indigo-200 uppercase">AI Video Generation</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
              Create Viral <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">Reels</span> with AI.
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Transform your long content into engaging short-form videos in seconds. 
              Smart timestamps, auto-trimming, and professional layouts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-12">
            {[
              { label: "AI Powered", icon: "🤖" },
              { label: "Fast Export", icon: "⚡" },
              { label: "Smart Layout", icon: "📐" },
              { label: "Cloud Storage", icon: "☁️" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-bold text-slate-200">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-12 left-16 right-16 flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>© 2026 SnapReel</span>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="lg:hidden absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[80px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[80px]" />
        </div>

        <div className="lg:hidden mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
            SnapReel
          </h2>
        </div>

        {children}
      </div>
    </div>
  );
}