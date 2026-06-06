import SignOutButton from './SignOutButton';

export default function Sidebar({
  commandQueue = [],
  route = 'overview',
  onNavigate = () => {},
}) {
  // Match the exact look and feel of the dashboard sidebar (dark premium, clean text-only nav)
  const navItems = [
    { id: 'overview', label: 'Home' },
    { id: 'map', label: 'Live Map' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'ai', label: 'AI Agent' },
    { id: 'finance', label: 'Earnings' },
    { id: 'charging', label: 'Charging' },
    { id: 'settings', label: 'Settings' },
  ];

  const isActive = (id) => route === id;

  return (
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#0a0a0a] text-white lg:flex">
      <div className="p-6 flex-1">
        {/* Brand — matches dashboard */}
        <div className="flex items-center mb-10">
          <div className="text-2xl font-semibold tracking-[-0.8px]">RoboAgent</div>
        </div>

        {/* Navigation — exact match to dashboard pills */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-5 py-3.5 rounded-2xl text-lg font-medium cursor-pointer transition ${
                isActive(item.id) ? 'bg-white text-black' : 'hover:bg-white/5'
              }`}
            >
              {item.label}
              {item.id === 'ai' && commandQueue.length > 0 && (
                <span className="ml-2 rounded-full bg-emerald-400 text-black text-[10px] font-semibold tracking-wider px-1.5 py-0.5">
                  {commandQueue.length}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Sign out — matches dashboard */}
      <div className="p-6 border-t border-white/10">
        <SignOutButton
          onSignedOut={() => onNavigate('landing')}
          className="w-full text-left text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-2xl px-5 py-3 transition"
          label="Sign out"
          compact
        />
      </div>
    </aside>
  );
}
