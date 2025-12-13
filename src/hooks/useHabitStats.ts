import { useMemo } from 'react';
import { Habit, HabitRecord } from './useHabitTracker';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

export interface HabitStat {
    id: string;
    title: string;
    color: string;
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    completionRate: number;
}

export interface DayActivity {
    date: string;
    count: number;
    intensity: number; // 0-4 scale for heatmap
}

export interface TrendData {
    date: string;
    [habitId: string]: number | string; // percentage
}

export function useHabitStats(habits: Habit[], records: HabitRecord) {
    return useMemo(() => {
        const today = new Date();
        const allDates = Object.keys(records).sort();

        // 1. Calculate Individual Habit Stats
        const habitStats: HabitStat[] = habits.map(habit => {
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            let totalDays = 0;

            // Calculate Total Days
            allDates.forEach(date => {
                if (records[date][habit.id] === 'done') {
                    totalDays++;
                }
            });

            // Calculate Streaks
            // Sort dates where this habit was done
            const doneDates = allDates
                .filter(date => records[date][habit.id] === 'done')
                .sort();

            // Longest Streak
            for (let i = 0; i < doneDates.length; i++) {
                const curr = new Date(doneDates[i]);
                const prev = i > 0 ? new Date(doneDates[i - 1]) : null;

                if (prev) {
                    const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff === 1) tempStreak++;
                    else tempStreak = 1;
                } else {
                    tempStreak = 1;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            }

            // Current Streak
            let checkDate = new Date(today);
            if (records[checkDate.toISOString().split('T')[0]]?.[habit.id] !== 'done') {
                // Check yesterday if today is not done (or not yet marked)
                // If strictly missed today, streak is 0. If just not marked, strictly speaking streak continues if yesterday was done.
                // For simplicity: if today is NOT 'missed', we check yesterday.
                if (records[checkDate.toISOString().split('T')[0]]?.[habit.id] === 'missed') {
                    currentStreak = 0;
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                    while (true) {
                        const key = checkDate.toISOString().split('T')[0];
                        if (records[key]?.[habit.id] === 'done') {
                            currentStreak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }
            } else {
                // Today is done
                while (true) {
                    const key = checkDate.toISOString().split('T')[0];
                    if (records[key]?.[habit.id] === 'done') {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }

            // Completion Rate (last 30 days)
            const last30Days = subDays(today, 29);
            let daysChecked = 0;
            let daysCompleted = 0;

            eachDayOfInterval({ start: last30Days, end: today }).forEach(day => {
                const key = day.toISOString().split('T')[0];
                const status = records[key]?.[habit.id];
                if (status === 'done') daysCompleted++;
                if (status) daysChecked++; // Only count days where there is a record? Or all days? 
                // Requirement: completion rate usually implies (done / total days elapsed).
            });
            // Simple rate: Done / 30
            const rate = Math.round((daysCompleted / 30) * 100);

            return {
                id: habit.id,
                title: habit.title,
                color: habit.color,
                currentStreak,
                longestStreak,
                totalDays,
                completionRate: rate
            };
        });

        // 2. Heatmap Data (Last 365 Days)
        const heatmapData: DayActivity[] = [];
        const oneYearAgo = subDays(today, 365);

        eachDayOfInterval({ start: oneYearAgo, end: today }).forEach(day => {
            const key = day.toISOString().split('T')[0];
            const dayRecord = records[key] || {};
            const completedCount = habits.filter(h => dayRecord[h.id] === 'done').length;

            let intensity = 0;
            if (completedCount > 0) {
                const pct = completedCount / habits.length;
                if (pct <= 0.25) intensity = 1;
                else if (pct <= 0.50) intensity = 2;
                else if (pct <= 0.75) intensity = 3;
                else intensity = 4;
            }

            heatmapData.push({
                date: key,
                count: completedCount,
                intensity
            });
        });

        // 3. Trend Data (Last 7 days breakdown for Area Chart)
        const trendData: TrendData[] = [];
        const last7Days = subDays(today, 6);
        eachDayOfInterval({ start: last7Days, end: today }).forEach(day => {
            const key = day.toISOString().split('T')[0];
            const dayRecord = records[key] || {};
            const dataPoint: TrendData = { date: format(day, 'EEE', { locale: it }) };

            habits.forEach(habit => {
                // For trend chart, maybe we want cumulative? Or just 1/0?
                // A better trend might be weekly average. 
                // Let's stick to simple "Done=100, Missed=0, None=null" or similar for now?
                // Actually, AreaCharts usually show "Total Completion %" across all habits?
                // Let's do: % of habits completed that day.
                const status = dayRecord[habit.id];
                dataPoint[habit.id] = status === 'done' ? 100 : 0;
            });
            // Aggregate for "Overall" line
            const completedCount = habits.filter(h => dayRecord[h.id] === 'done').length;
            const totalPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
            dataPoint['overall'] = totalPct;

            trendData.push(dataPoint);
        });

        // Sort habit stats by completion rate best first
        habitStats.sort((a, b) => b.completionRate - a.completionRate);

        const totalActiveDays = allDates.length;
        const globalSuccessRate = habitStats.length > 0
            ? Math.round(habitStats.reduce((acc, curr) => acc + curr.completionRate, 0) / habitStats.length)
            : 0;

        return {
            habitStats,
            heatmapData,
            trendData,
            globalStats: {
                totalActiveDays,
                globalSuccessRate,
                bestStreak: Math.max(...habitStats.map(h => h.longestStreak), 0)
            }
        };
    }, [habits, records]);
}
