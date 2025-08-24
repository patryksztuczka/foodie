import { Outlet } from 'react-router';
import { BottomNav } from '@components/bottom-nav.tsx';

export const Layout = () => {
  return (
    <div className="mx-auto max-w-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
      <Outlet />
      <BottomNav />
    </div>
  );
};
