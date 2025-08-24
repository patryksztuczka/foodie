import { useMemo, useState } from 'react';
import { WeekStrip } from '@components/week-strip.tsx';
import { MealsList } from '@components/meals-list';

export const HomePage = () => {
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  return (
    <>
      <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      <MealsList date={selectedDate} />
    </>
  );
};
