import { HabitCalendar } from '@/components/HabitCalendar';
import { HabitSettings } from '@/components/HabitSettings';
import { useHabitTracker } from '@/hooks/useHabitTracker';

const Index = () => {
  const {
    habits,
    records,
    addHabit,
    removeHabit,
    toggleHabitStatus
  } = useHabitTracker();

  return (
    <div className="flex-1 min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 space-y-8 animate-fade-in">
      <div className="w-full w-[min(100%,_500px)] space-y-6">

        {/* Header Section */}
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Il Tuo Percorso</h1>
            <p className="text-muted-foreground text-sm">Costruisci la tua versione migliore, giorno dopo giorno.</p>
          </div>
          <HabitSettings
            habits={habits}
            onAddHabit={addHabit}
            onRemoveHabit={removeHabit}
          />
        </div>

        {/* Main Calendar */}
        <HabitCalendar
          habits={habits}
          records={records}
          onToggleHabit={toggleHabitStatus}
        />

        {/* Quote / Footer */}
        <div className="text-center pt-8 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Keep Going</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
