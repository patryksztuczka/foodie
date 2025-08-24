import { createBrowserRouter } from 'react-router';
import { Layout } from '@components/layouts/layout.tsx';
import { HomePage } from '@components/pages/home-page.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'discover',
        lazy: async () => ({ Component: (await import('@components/mock-screens.tsx')).DiscoverPage }),
      },
      {
        path: 'planner',
        lazy: async () => ({ Component: (await import('@components/mock-screens.tsx')).PlannerPage }),
      },
      {
        path: 'profile',
        lazy: async () => ({ Component: (await import('@components/mock-screens.tsx')).ProfilePage }),
      },
    ],
  },
]);
