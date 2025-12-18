import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Goal, GoalLogsMap } from '@/types/goals';
import { DayDetailsModal } from './DayDetailsModal';

interface WeeklyViewProps {
    habits: Goal[];
    records: GoalLogsMap;
    onToggleHabit: (date: Date, habitId: string) => void;
}

export function WeeklyView({ habits, records, onToggleHabit }: WeeklyViewProps) {
    // Stable today reference to avoid re-calculating weekStart on every render (microseconds shift)
    const today = useMemo(() => new Date(), []);

    // Stable weekStart
    const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]); // Monday

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, [weekStart]);

    // Memoize the day record for the modal to ensure referential stability if content hasn't changed, 
    // but here we want IT TO CHANGE if records changes. 
    // We compute the key explicitly.
    const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    const selectedDayRecord = selectedDateKey ? (records[selectedDateKey] || {}) : {};

    return (
        <div className="w-full h-full p-6 animate-scale-in">
            <h2 className="text-xl font-display font-bold mb-6">Questa Settimana</h2>

            <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {weekDays.map((date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayRecord = records[dateKey] || {};
                    const isToday = isSameDay(date, today);
                    // Reset today to midnight for correct comparison
                    const todayMidnight = new Date(today);
                    todayMidnight.setHours(0, 0, 0, 0);
                    const isFuture = date > todayMidnight;

                    return (
                        <div key={dateKey} className="flex flex-col gap-2">
                            {/* Header */}
                            <button
                                onClick={() => !isFuture && setSelectedDate(date)}
                                disabled={isFuture}
                                className={cn(
                                    "text-center py-2 rounded-xl border border-transparent transition-all w-full",
                                    isToday && "bg-primary/10 border-primary/20 text-primary",
                                    !isFuture && "hover:bg-white/5 hover:border-white/10 cursor-pointer active:scale-95",
                                    isFuture && "opacity-50 cursor-default"
                                )}>
                                <div className="text-[10px] uppercase font-bold opacity-60">{format(date, 'EEE', { locale: it })}</div>
                                <div className="text-lg font-mono font-bold">{format(date, 'd')}</div>
                            </button>

                            {/* Habits Column caused by grid */}
                            <div className="flex flex-col gap-2">
                                {habits.map(habit => {
                                    const isStarted = habit.start_date <= dateKey;
                                    const isEnded = habit.end_date && habit.end_date < dateKey;

                                    if (!isStarted || isEnded) {
                                        return <div key={habit.id} className="aspect-square rounded-xl invisible" />;
                                    }

                                    const status = dayRecord[habit.id];

                                    return (
                                        <button
                                            key={habit.id}
                                            disabled={isFuture}
                                            onClick={() => onToggleHabit(date, habit.id)}
                                            className={cn(
                                                "aspect-square rounded-xl border border-white/5 flex items-center justify-center transition-all hover:border-white/20",
                                                isFuture && "opacity-30 cursor-not-allowed",
                                                status === 'done' && "opacity-100 shadow-[0_0_10px_currentColor]",
                                                status === 'missed' && "opacity-50 grayscale",
                                                !status && !isFuture && "bg-white/5"
                                            )}
                                            style={{
                                                backgroundColor: status === 'done' ? habit.color : undefined,
                                                color: habit.color
                                            }}
                                        >
                                            {/* Maybe an icon or just simple color block */}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <DayDetailsModal
                isOpen={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                date={selectedDate}
                habits={habits}
                dayRecord={selectedDayRecord}
                onToggleHabit={(habitId) => selectedDate && onToggleHabit(selectedDate, habitId)}
            />
        </div >
    );
}
