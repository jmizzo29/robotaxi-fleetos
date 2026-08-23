import Logo from './Logo';

export default function PublicHeader({ onNavigate }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1C1D21]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center relative">
        {/* Left: one menu */}
        <button 
          onClick={() => onNavigate('how-it-works')}
          className="text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90 hover:text-white transition"
        >
          HOW IT WORKS
        </button>

        {/* EXACT MIDDLE: RoboAgent (you will provide the file) */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:opacity-90 transition"
          onClick={() => onNavigate('landing')}
        >
          <Logo className="h-7 sm:h-8" />
        </div>

        {/* Right: the other two menus */}
        <div className="ml-auto flex items-center gap-8 sm:gap-10 text-sm sm:text-[13px] font-medium uppercase tracking-[0.5px] text-white/90">
          <button 
            onClick={() => onNavigate('login')}
            className="hover:text-white transition"
          >
            SIGN IN
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="hover:text-white transition"
          >
            ABOUT
          </button>
        </div>
      </div>
    </header>
  );
}
