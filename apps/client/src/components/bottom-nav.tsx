import { CalendarDays, Compass, Home, User } from 'lucide-react';
import { NavLink } from 'react-router';

const TABS = [
  { key: 'home', label: 'Dziś', icon: <Home className="h-5 w-5" /> },
  { key: 'discover', label: 'Discover', icon: <Compass className="h-5 w-5" /> },
  { key: 'planner', label: 'Planner', icon: <CalendarDays className="h-5 w-5" /> },
  { key: 'profile', label: 'Profil', icon: <User className="h-5 w-5" /> },
] as const;

export const BottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-2xl px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <div className="flex items-center justify-around rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur">
          {TABS.map((tab) => {
            return (
              <NavLink
                key={tab.key}
                to={tab.key === 'home' ? '/' : `/${tab.key}`}
                className={({ isActive: rrActive }) =>
                  'flex h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-full px-2 text-xs transition-colors ' +
                  (rrActive ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center">{tab.icon}</span>
                </div>
                <span className="mt-0.5 text-[11px] leading-none">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
