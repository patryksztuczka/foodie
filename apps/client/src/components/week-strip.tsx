import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listMealSummary, type MealSummaryDay } from '../data-access-layer/meals.ts';

type WeekStripProps = {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // adjust when day is sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const WeekStrip = ({ selectedDate, onSelect }: WeekStripProps) => {
  const todayIso = useMemo(() => toISODate(new Date()), []);

  const { days, from, to } = useMemo(() => {
    const today = new Date(selectedDate);
    const monday = getMonday(today);
    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      list.push(toISODate(d));
    }
    return { days: list, from: list[0], to: list[list.length - 1] };
  }, [selectedDate]);

  const { data } = useQuery({
    queryKey: ['meals-summary', from, to],
    queryFn: () => listMealSummary(from, to),
  });

  const map = useMemo(() => {
    const m = new Map<string, MealSummaryDay>();
    for (const d of data?.days ?? []) m.set(d.date, d);
    return m;
  }, [data]);

  return (
    <div className="flex items-center gap-2 p-4">
      {days.map((d) => {
        const weekday = new Date(d).toLocaleDateString(undefined, { weekday: 'long' });
        const firstLetter = weekday.slice(0, 3).toUpperCase();
        const dayNumber = Number(d.slice(8, 10));
        const kcal = map.get(d)?.calories ?? 0;
        const isSelected = d === selectedDate;
        const isToday = d === todayIso;
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={
              'flex h-16 w-12 flex-col items-center justify-center rounded border text-xs ' +
              (isSelected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-800') +
              (isToday ? ' ring-1 ring-green-500' : '')
            }
            title={weekday}
            aria-label={weekday}
          >
            <div className="font-semibold">{firstLetter}</div>
            <div className="text-sm">{dayNumber}</div>
            <div className="text-[10px] text-gray-600">{kcal} kcal</div>
          </button>
        );
      })}
    </div>
  );
};
