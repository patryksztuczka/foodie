import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MealsList } from './components/meals-list';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MealsList />
    </QueryClientProvider>
  );
}

export default App;
