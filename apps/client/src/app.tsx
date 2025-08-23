import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { MealsList } from './components/meals-list';
import { WeekStrip } from './components/week-strip.tsx';

const queryClient = new QueryClient();

function App() {
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  return (
    <QueryClientProvider client={queryClient}>
      <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      <MealsList date={selectedDate} />
    </QueryClientProvider>
  );
}

export default App;
