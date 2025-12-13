import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { YearlyHeatmap } from '@/components/YearlyHeatmap';
import { useReadingTracker } from '@/hooks/useReadingTracker';
import { useReadingStats } from '@/hooks/useReadingStats';

const Mappa = () => {
  const { records } = useReadingTracker();
  const stats = useReadingStats(records);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = stats.yearlyStats.length > 0
    ? stats.yearlyStats.map(y => y.year)
    : [currentYear];

  const selectedYearStats = stats.yearlyStats.find(y => y.year === selectedYear);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl animate-fade-in">
      <div className="glass-panel rounded-3xl p-4 sm:p-8 space-y-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Mappa Attività
            </h1>
            <p className="text-muted-foreground font-light">
              Visualizza la tua coerenza nel corso dell'anno
            </p>
          </div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-full sm:w-32 bg-white/5 border-white/10 backdrop-blur-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Heatmap */}
        <YearlyHeatmap records={records} year={selectedYear} />

        {/* Stats Cards */}
        {selectedYearStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center group cursor-default">
              <p className="text-3xl sm:text-4xl font-mono text-success font-bold mb-1 group-hover:scale-110 transition-transform">{selectedYearStats.totalDaysRead}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Giorni Completati</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center group cursor-default">
              <p className="text-3xl sm:text-4xl font-mono text-destructive font-bold mb-1 group-hover:scale-110 transition-transform">{selectedYearStats.totalDaysMissed}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Giorni Saltati</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center group cursor-default">
              <p className="text-3xl sm:text-4xl font-mono text-primary font-bold mb-1 group-hover:scale-110 transition-transform">{selectedYearStats.longestStreak}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Serie Record</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center group cursor-default">
              <p className="text-3xl sm:text-4xl font-mono text-foreground font-bold mb-1 group-hover:scale-110 transition-transform">{selectedYearStats.percentage}%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tasso Successo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mappa;
