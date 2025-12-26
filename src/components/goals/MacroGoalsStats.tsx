import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Line
} from 'recharts';
import { Loader2, Trophy, Target, TrendingUp, CheckCircle2, Zap, Brain, Rocket } from 'lucide-react';
import { useGoalCategories } from '@/hooks/useGoalCategories';

interface MacroGoalsStatsProps {
    year: number;
}

export function MacroGoalsStats({ year }: MacroGoalsStatsProps) {
    const { getLabel } = useGoalCategories();
    const { data: allGoals, isLoading } = useQuery({
        queryKey: ['longTermGoals', 'stats', year],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('long_term_goals')
                .select('*')
                .eq('year', year);
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!allGoals || allGoals.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-xl text-muted-foreground">
                Nessun dato disponibile per il {year}. Aggiungi qualche obiettivo!
            </div>
        );
    }

    // --- KPIs ---
    const totalGoals = allGoals.length;
    const completedGoals = allGoals.filter(g => g.is_completed).length;
    const completionRate = Math.round((completedGoals / totalGoals) * 100) || 0;

    const byType = {
        annual: allGoals.filter(g => g.type === 'annual').length,
        monthly: allGoals.filter(g => g.type === 'monthly').length,
        weekly: allGoals.filter(g => g.type === 'weekly').length,
    };
    const mainFocus = Object.entries(byType).sort((a, b) => b[1] - a[1])[0][0];

    // --- Data Preparation ---

    // 1. Monthly Data (Progress & Velocity)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(2024, i).toLocaleString('it-IT', { month: 'short' }),
        monthIndex: i + 1,
        total: 0,
        completed: 0,
        rate: 0,
        cumulativeTotal: 0,
        cumulativeCompleted: 0,
    }));

    // Distribute goals to months
    // For 'annual' goals, we'll assign them to the month they were created or Jan if missing, 
    // but for "Velocity" it's often better to see them accumulate. 
    // Let's simplified: Map goals to their specific month. Annual goals -> effectively "Jan" or spread? 
    // Let's count Annual goals as "Active throughout", adding to the total from the start.

    let runningTotal = 0;
    let runningCompleted = 0;

    // Pre-calculate annual base
    const annualGoals = allGoals.filter(g => g.type === 'annual');
    const annualTotal = annualGoals.length;
    const annualCompleted = annualGoals.filter(g => g.is_completed).length;

    // We will initialize the cumulative with annual counts, but detailed monthly stats only track that month's specific goals
    // flexible choice: let's keep monthly stats specific to "monthly/weekly" goals for the bars, 
    // but use ALL goals for the Velocity line.

    allGoals.forEach(g => {
        let mIdx = 0; // Default Jan
        if (g.month) mIdx = g.month - 1;
        // Clamp to 0-11
        if (mIdx < 0) mIdx = 0;
        if (mIdx > 11) mIdx = 11;

        monthlyData[mIdx].total++;
        if (g.is_completed) monthlyData[mIdx].completed++;
    });

    // Calculate rates and cumulatives
    monthlyData.forEach((d, i) => {
        d.rate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;

        runningTotal += d.total;
        runningCompleted += d.completed;
        d.cumulativeTotal = runningTotal;
        d.cumulativeCompleted = runningCompleted;
    });


    // 2. Category Radar Data
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    allGoals.forEach(g => {
        const c = g.color || 'null';
        if (!categoryStats[c]) categoryStats[c] = { total: 0, completed: 0 };
        categoryStats[c].total++;
        if (g.is_completed) categoryStats[c].completed++;
    });

    const radarData = Object.entries(categoryStats).map(([key, stats]) => ({
        subject: getLabel(key === 'null' ? null : key),
        A: Math.round((stats.completed / stats.total) * 100),
        fullMark: 100,
        total: stats.total // Keep for reference
    })).sort((a, b) => b.A - a.A);


    // 3. Color Distribution (Pie)
    const chartColors: Record<string, string> = {
        'red': '#f43f5e', 'orange': '#f97316', 'yellow': '#fbbf24', 'green': '#10b981',
        'blue': '#2563eb', 'purple': '#7c3aed', 'pink': '#d946ef', 'cyan': '#06b6d4', 'null': '#525252'
    };
    const pieData = Object.entries(categoryStats).map(([key, stats]) => ({
        name: getLabel(key === 'null' ? null : key),
        value: stats.total,
        fill: chartColors[key] || '#888888'
    })).sort((a, b) => b.value - a.value);


    // --- Insights Generation ---
    // 1. Best Type Logic
    const typeStats = [
        { type: 'Annuale', total: byType.annual, completed: allGoals.filter(g => g.type === 'annual' && g.is_completed).length },
        { type: 'Mensile', total: byType.monthly, completed: allGoals.filter(g => g.type === 'monthly' && g.is_completed).length },
        { type: 'Settimanale', total: byType.weekly, completed: allGoals.filter(g => g.type === 'weekly' && g.is_completed).length },
    ].map(t => ({
        ...t,
        rate: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0
    })).sort((a, b) => b.rate - a.rate || b.completed - a.completed);

    const bestType = typeStats[0];

    // 2. Best Month Logic (Efficiency > Volume)
    const bestMonth = [...monthlyData]
        .filter(m => m.total > 0) // Only consider active months
        .sort((a, b) => b.rate - a.rate || b.completed - a.completed)[0];

    // 3. Category Logic
    const bestCategory = radarData.length > 0 ? radarData[0] : null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Top Insights Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-400">Punto di Forza</CardTitle>
                        <Zap className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{bestCategory?.subject || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {bestCategory ? `${bestCategory.A}% di completamento` : 'Nessun dato'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-400">Mese Migliore</CardTitle>
                        <Trophy className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{bestMonth?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {bestMonth ? `${bestMonth.rate}% di successo (${bestMonth.completed}/${bestMonth.total})` : 'Nessuna attività'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-400">Tipologia Efficace</CardTitle>
                        <Brain className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white capitalize">
                            {bestType.total > 0 ? bestType.type : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {bestType.total > 0 ? `${bestType.rate}% di successo` : 'Dati insufficienti'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Standard KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Totale</CardTitle>
                        <Target className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalGoals}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{completedGoals}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Successo</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{completionRate}%</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {runningCompleted > 0 ? 'In Crescita' : 'Stabile'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Charts Row 1: Velocity & Radar */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Goal Velocity */}
                <Card className="md:col-span-2 bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-orange-500" />
                            <CardTitle>Velocità di Esecuzione (Cumulativa)</CardTitle>
                        </div>
                        <CardDescription>Confronto tra obiettivi pianificati e completati nel tempo</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="cumulativeTotal" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" name="Obiettivi Totali" />
                                <Area type="monotone" dataKey="cumulativeCompleted" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCompleted)" name="Obiettivi Completati" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Radar */}
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-cyan-500" />
                            <CardTitle>Performance Categorie</CardTitle>
                        </div>
                        <CardDescription>Tasso di successo per categoria</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#ffffff20" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Success Rate"
                                    dataKey="A"
                                    stroke="#06b6d4"
                                    fill="#06b6d4"
                                    fillOpacity={0.5}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [`${value}%`, 'Successo']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Monthly Activity & Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Activity Breakdown */}
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Attività Mensile</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <CartesianGrid stroke="#ffffff10" />
                                <Bar dataKey="total" barSize={20} fill="#413ea0" radius={[4, 4, 0, 0]} name="Creati" />
                                <Line type="monotone" dataKey="completed" stroke="#ff7300" strokeWidth={2} name="Completati" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Color Distribution Pie */}
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Distribuzione Categorie</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend formatter={(value, entry: any) => <span style={{ color: '#ccc' }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
