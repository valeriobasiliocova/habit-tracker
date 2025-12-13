import { useHabitTracker } from '@/hooks/useHabitTracker';
import { useHabitStats } from '@/hooks/useHabitStats';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { TrendChart } from '@/components/stats/TrendChart';
import { HabitRadar } from '@/components/stats/HabitRadar';

const Stats = () => {
    const { habits, records } = useHabitTracker();
    const stats = useHabitStats(habits, records);

    // Find best habit
    const bestHabit = stats.habitStats.reduce((prev, current) =>
        (prev.completionRate > current.completionRate) ? prev : current
        , stats.habitStats[0]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 animate-fade-in pb-24">
            <div className="space-y-2">
                <h1 className="text-3xl font-display font-bold">Le tue Statistiche</h1>
                <p className="text-muted-foreground">Analisi dettagliata delle tue performance.</p>
            </div>

            {/* Overview Cards */}
            <StatsOverview globalStats={stats.globalStats} bestHabit={bestHabit} />

            {/* Heatmap - Full Width */}
            <ActivityHeatmap data={stats.heatmapData} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrendChart data={stats.trendData} />
                <HabitRadar stats={stats.habitStats} />
            </div>

            {/* Detailed Table (Optional, or just a list) */}
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 border border-white/5 shadow-xl">
                <h3 className="text-lg font-display font-semibold mb-4">Dettagli Abitudini</h3>
                <div className="space-y-4">
                    {stats.habitStats.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                                <span className="font-medium">{habit.title}</span>
                            </div>
                            <div className="flex gap-6 text-sm text-muted-foreground">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs uppercase tracking-wider opacity-70">Serie</span>
                                    <span className="font-semibold text-foreground">{habit.currentStreak} gg</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs uppercase tracking-wider opacity-70">Rate</span>
                                    <span className="font-semibold text-foreground">{habit.completionRate}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Stats;
