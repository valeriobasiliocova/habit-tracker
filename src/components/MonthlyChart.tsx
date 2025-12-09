import { YearStats, MonthStats } from '@/hooks/useReadingStats';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Award, Calendar, BarChart3 } from 'lucide-react';

interface MonthlyChartProps {
  yearStats: YearStats;
}

export function MonthlyChart({ yearStats }: MonthlyChartProps) {
  const maxDays = Math.max(...yearStats.monthlyBreakdown.map(m => m.daysTotal), 1);
  
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">
          Andamento mensile {yearStats.year}
        </h3>
      </div>
      
      <div className="space-y-3">
        {yearStats.monthlyBreakdown.map((month) => (
          <MonthBar key={month.month} month={month} maxDays={maxDays} />
        ))}
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
        {yearStats.bestMonth && (
          <div className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
            <TrendingUp className="w-5 h-5 text-success mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Mese migliore</p>
              <p className="font-semibold text-foreground">{yearStats.bestMonth.name}</p>
              <p className="text-sm text-success">{yearStats.bestMonth.percentage}%</p>
            </div>
          </div>
        )}
        
        {yearStats.worstMonth && yearStats.worstMonth.daysTotal > 0 && (
          <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
            <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Mese peggiore</p>
              <p className="font-semibold text-foreground">{yearStats.worstMonth.name}</p>
              <p className="text-sm text-destructive">{yearStats.worstMonth.percentage}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthBar({ month, maxDays }: { month: MonthStats; maxDays: number }) {
  const today = new Date();
  const isCurrentMonth = month.month === today.getMonth() && month.year === today.getFullYear();
  const isFutureMonth = new Date(month.year, month.month, 1) > today;
  
  const doneWidth = maxDays > 0 ? (month.daysRead / maxDays) * 100 : 0;
  const missedWidth = maxDays > 0 ? (month.daysMissed / maxDays) * 100 : 0;
  
  return (
    <div className={cn(
      "group",
      isFutureMonth && "opacity-30"
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium w-20",
            isCurrentMonth ? "text-primary" : "text-foreground"
          )}>
            {month.name.slice(0, 3)}
          </span>
          {isCurrentMonth && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Attuale
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-success">{month.daysRead} letti</span>
          <span className="text-destructive">{month.daysMissed} saltati</span>
          {month.daysTotal > 0 && (
            <span className={cn(
              "font-semibold",
              month.percentage >= 70 ? "text-success" : month.percentage >= 40 ? "text-foreground" : "text-destructive"
            )}>
              {month.percentage}%
            </span>
          )}
        </div>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-success transition-all duration-500"
          style={{ width: `${doneWidth}%` }}
        />
        <div 
          className="h-full bg-destructive transition-all duration-500"
          style={{ width: `${missedWidth}%` }}
        />
      </div>
    </div>
  );
}
