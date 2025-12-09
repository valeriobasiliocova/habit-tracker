import { useMemo } from 'react';
import { ReadingRecord, ReadingStatus } from './useReadingTracker';

export interface DayStats {
  date: string;
  status: ReadingStatus;
  dayOfWeek: number;
  weekOfYear: number;
  month: number;
  year: number;
}

export interface WeekStats {
  weekNumber: number;
  year: number;
  daysRead: number;
  daysMissed: number;
  daysTotal: number;
  percentage: number;
}

export interface MonthStats {
  month: number;
  year: number;
  name: string;
  daysRead: number;
  daysMissed: number;
  daysTotal: number;
  percentage: number;
  bestStreak: number;
}

export interface YearStats {
  year: number;
  totalDaysRead: number;
  totalDaysMissed: number;
  totalDaysMarked: number;
  percentage: number;
  bestMonth: MonthStats | null;
  worstMonth: MonthStats | null;
  longestStreak: number;
  averagePerWeek: number;
  averagePerMonth: number;
  monthlyBreakdown: MonthStats[];
  weeklyBreakdown: WeekStats[];
}

export interface OverallStats {
  totalDaysRead: number;
  totalDaysMissed: number;
  totalDaysMarked: number;
  percentage: number;
  currentStreak: number;
  longestStreak: number;
  firstRecordDate: Date | null;
  lastRecordDate: Date | null;
  daysSinceStart: number;
  consistencyScore: number;
  bestDayOfWeek: { day: string; percentage: number } | null;
  worstDayOfWeek: { day: string; percentage: number } | null;
}

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function useReadingStats(records: ReadingRecord) {
  const stats = useMemo(() => {
    const allDays: DayStats[] = Object.entries(records).map(([dateStr, status]) => {
      const date = new Date(dateStr);
      return {
        date: dateStr,
        status,
        dayOfWeek: date.getDay(),
        weekOfYear: getWeekNumber(date),
        month: date.getMonth(),
        year: date.getFullYear(),
      };
    });

    const readDates = allDays
      .filter(d => d.status === 'done')
      .map(d => d.date)
      .sort();

    const missedDates = allDays
      .filter(d => d.status === 'missed')
      .map(d => d.date)
      .sort();

    // Overall stats
    const totalDaysRead = readDates.length;
    const totalDaysMissed = missedDates.length;
    const totalDaysMarked = totalDaysRead + totalDaysMissed;
    const percentage = totalDaysMarked > 0 ? Math.round((totalDaysRead / totalDaysMarked) * 100) : 0;
    const longestStreak = calculateStreak(readDates);

    // Current streak
    let currentStreak = 0;
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    let checkDate = new Date(today);
    
    while (true) {
      const key = checkDate.toISOString().split('T')[0];
      if (records[key] === 'done') {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (key === todayKey && !records[key]) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // First and last record dates
    const allDates = Object.keys(records).sort();
    const firstRecordDate = allDates.length > 0 ? new Date(allDates[0]) : null;
    const lastRecordDate = allDates.length > 0 ? new Date(allDates[allDates.length - 1]) : null;
    const daysSinceStart = firstRecordDate 
      ? Math.floor((today.getTime() - firstRecordDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    // Consistency score (% of days marked since start)
    const consistencyScore = daysSinceStart > 0 
      ? Math.round((totalDaysMarked / daysSinceStart) * 100)
      : 0;

    // Day of week analysis
    const dayOfWeekStats: { [key: number]: { done: number; total: number } } = {};
    for (let i = 0; i < 7; i++) {
      dayOfWeekStats[i] = { done: 0, total: 0 };
    }
    allDays.forEach(day => {
      dayOfWeekStats[day.dayOfWeek].total++;
      if (day.status === 'done') {
        dayOfWeekStats[day.dayOfWeek].done++;
      }
    });

    let bestDayOfWeek: { day: string; percentage: number } | null = null;
    let worstDayOfWeek: { day: string; percentage: number } | null = null;
    let bestPct = -1;
    let worstPct = 101;

    Object.entries(dayOfWeekStats).forEach(([dayNum, stats]) => {
      if (stats.total > 0) {
        const pct = Math.round((stats.done / stats.total) * 100);
        if (pct > bestPct) {
          bestPct = pct;
          bestDayOfWeek = { day: DAY_NAMES[parseInt(dayNum)], percentage: pct };
        }
        if (pct < worstPct) {
          worstPct = pct;
          worstDayOfWeek = { day: DAY_NAMES[parseInt(dayNum)], percentage: pct };
        }
      }
    });

    const overall: OverallStats = {
      totalDaysRead,
      totalDaysMissed,
      totalDaysMarked,
      percentage,
      currentStreak,
      longestStreak,
      firstRecordDate,
      lastRecordDate,
      daysSinceStart,
      consistencyScore,
      bestDayOfWeek,
      worstDayOfWeek,
    };

    // Year stats
    const years = [...new Set(allDays.map(d => d.year))].sort();
    const yearlyStats: YearStats[] = years.map(year => {
      const yearDays = allDays.filter(d => d.year === year);
      const yearReadDates = yearDays.filter(d => d.status === 'done').map(d => d.date).sort();
      const yearMissedDates = yearDays.filter(d => d.status === 'missed');
      
      const totalDaysRead = yearReadDates.length;
      const totalDaysMissed = yearMissedDates.length;
      const totalDaysMarked = totalDaysRead + totalDaysMissed;
      const percentage = totalDaysMarked > 0 ? Math.round((totalDaysRead / totalDaysMarked) * 100) : 0;
      const longestStreak = calculateStreak(yearReadDates);

      // Monthly breakdown
      const monthlyBreakdown: MonthStats[] = [];
      for (let month = 0; month < 12; month++) {
        const monthDays = yearDays.filter(d => d.month === month);
        const monthReadDates = monthDays.filter(d => d.status === 'done').map(d => d.date).sort();
        const monthMissedDates = monthDays.filter(d => d.status === 'missed');
        
        const daysRead = monthReadDates.length;
        const daysMissed = monthMissedDates.length;
        const daysTotal = daysRead + daysMissed;
        
        monthlyBreakdown.push({
          month,
          year,
          name: MONTH_NAMES[month],
          daysRead,
          daysMissed,
          daysTotal,
          percentage: daysTotal > 0 ? Math.round((daysRead / daysTotal) * 100) : 0,
          bestStreak: calculateStreak(monthReadDates),
        });
      }

      // Weekly breakdown
      const weeklyBreakdown: WeekStats[] = [];
      const weeks = [...new Set(yearDays.map(d => d.weekOfYear))].sort((a, b) => a - b);
      weeks.forEach(weekNumber => {
        const weekDays = yearDays.filter(d => d.weekOfYear === weekNumber);
        const daysRead = weekDays.filter(d => d.status === 'done').length;
        const daysMissed = weekDays.filter(d => d.status === 'missed').length;
        const daysTotal = daysRead + daysMissed;
        
        weeklyBreakdown.push({
          weekNumber,
          year,
          daysRead,
          daysMissed,
          daysTotal,
          percentage: daysTotal > 0 ? Math.round((daysRead / daysTotal) * 100) : 0,
        });
      });

      const monthsWithData = monthlyBreakdown.filter(m => m.daysTotal > 0);
      const bestMonth = monthsWithData.length > 0 
        ? monthsWithData.reduce((a, b) => a.percentage > b.percentage ? a : b)
        : null;
      const worstMonth = monthsWithData.length > 0
        ? monthsWithData.reduce((a, b) => a.percentage < b.percentage ? a : b)
        : null;

      const weeksWithData = weeklyBreakdown.filter(w => w.daysTotal > 0);
      const averagePerWeek = weeksWithData.length > 0
        ? Math.round(totalDaysRead / weeksWithData.length * 10) / 10
        : 0;
      const averagePerMonth = monthsWithData.length > 0
        ? Math.round(totalDaysRead / monthsWithData.length * 10) / 10
        : 0;

      return {
        year,
        totalDaysRead,
        totalDaysMissed,
        totalDaysMarked,
        percentage,
        bestMonth,
        worstMonth,
        longestStreak,
        averagePerWeek,
        averagePerMonth,
        monthlyBreakdown,
        weeklyBreakdown,
      };
    });

    // Current month stats
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthDays = allDays.filter(d => d.month === currentMonth && d.year === currentYear);
    const currentMonthReadDates = currentMonthDays.filter(d => d.status === 'done').map(d => d.date).sort();
    
    const monthStats: MonthStats = {
      month: currentMonth,
      year: currentYear,
      name: MONTH_NAMES[currentMonth],
      daysRead: currentMonthReadDates.length,
      daysMissed: currentMonthDays.filter(d => d.status === 'missed').length,
      daysTotal: currentMonthDays.length,
      percentage: currentMonthDays.length > 0 
        ? Math.round((currentMonthReadDates.length / currentMonthDays.length) * 100) 
        : 0,
      bestStreak: calculateStreak(currentMonthReadDates),
    };

    return {
      overall,
      yearlyStats,
      currentMonthStats: monthStats,
      currentYearStats: yearlyStats.find(y => y.year === currentYear) || null,
    };
  }, [records]);

  return stats;
}
