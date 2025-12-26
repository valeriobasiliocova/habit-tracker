import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar as CalendarIcon, Loader2, Download, Upload, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MacroGoalsStats } from './MacroGoalsStats';
import { GoalCategorySettingsDialog } from './GoalCategorySettingsDialog';
import { useGoalCategories } from '@/hooks/useGoalCategories';
import { useGoalBackup } from '@/hooks/useGoalBackup';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, getWeekOfMonth, getWeeksInMonth, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

type GoalType = 'annual' | 'monthly' | 'weekly' | 'stats';

interface LongTermGoal {
    id: string;
    title: string;
    is_completed: boolean;
    type: GoalType;
    year: number;
    month: number | null;
    week_number: number | null;
    created_at: string;
    color: string | null;
}

const goalColors = [
    { name: 'Nessuno', value: null, class: 'bg-card/20 border-white/5' },
    { name: 'Rosso', value: 'red', class: 'bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25' },
    { name: 'Arancione', value: 'orange', class: 'bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25' },
    { name: 'Giallo', value: 'yellow', class: 'bg-amber-400/15 border-amber-400/30 hover:bg-amber-400/25' },
    { name: 'Blu', value: 'blue', class: 'bg-blue-600/15 border-blue-600/30 hover:bg-blue-600/25' },
    { name: 'Viola', value: 'purple', class: 'bg-violet-600/15 border-violet-600/30 hover:bg-violet-600/25' },
    { name: 'Rosa', value: 'pink', class: 'bg-fuchsia-500/15 border-fuchsia-500/30 hover:bg-fuchsia-500/25' },
    { name: 'Ciano', value: 'cyan', class: 'bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25' },
];

export function LongTermGoals() {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedWeek, setSelectedWeek] = useState<number>(1); // Default to week 1, logic can be improved
    const [view, setView] = useState<GoalType>('annual');
    const [newGoalTitle, setNewGoalTitle] = useState('');

    const queryClient = useQueryClient();

    // Helper to calculate current week number
    useEffect(() => {
        const currentWeek = getWeekOfMonth(new Date(), { weekStartsOn: 1 }); // ISO 8601 (Monday start)
        setSelectedWeek(currentWeek);
    }, []);

    const { getLabel } = useGoalCategories();

    // Dynamic color object creation to include labels
    const getGoalColorClass = (colorValue: string | null) => {
        const staticColors = [
            { value: null, class: 'bg-card/20 border-white/5' },
            { value: 'red', class: 'bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25' },
            { value: 'orange', class: 'bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25' },
            { value: 'yellow', class: 'bg-amber-400/15 border-amber-400/30 hover:bg-amber-400/25' },
            { value: 'blue', class: 'bg-blue-600/15 border-blue-600/30 hover:bg-blue-600/25' },
            { value: 'purple', class: 'bg-violet-600/15 border-violet-600/30 hover:bg-violet-600/25' },
            { value: 'pink', class: 'bg-fuchsia-500/15 border-fuchsia-500/30 hover:bg-fuchsia-500/25' },
            { value: 'cyan', class: 'bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25' },
        ];
        return staticColors.find(c => c.value === colorValue)?.class || "bg-card/20 border-white/5 hover:bg-card/40";
    };

    const colorOptions = [
        { value: "red", bg: "bg-rose-500" },
        { value: "orange", bg: "bg-orange-500" },
        { value: "yellow", bg: "bg-amber-400" },
        { value: "green", bg: "bg-emerald-500" }, // Keep green in option data but filter if needed? No, user wanted green removed.
        { value: "blue", bg: "bg-blue-600" },
        { value: "purple", bg: "bg-violet-600" },
        { value: "pink", bg: "bg-fuchsia-500" },
        { value: "cyan", bg: "bg-cyan-500" },
    ].filter(c => c.value !== 'green'); // Ensure green is removed as per previous request

    const { data: goals, isLoading } = useQuery({
        queryKey: ['longTermGoals', view, selectedYear, selectedMonth, selectedWeek],
        queryFn: async () => {
            let query = supabase.from('long_term_goals')
                .select('*')
                .eq('type', view)
                .eq('year', selectedYear)
                .order('is_completed', { ascending: true })
                .order('color', { ascending: true, nullsFirst: false }) // Group by color
                .order('created_at', { ascending: true });

            if (view === 'monthly') {
                query = query.eq('month', selectedMonth);
            } else if (view === 'weekly') {
                query = query.eq('month', selectedMonth).eq('week_number', selectedWeek);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as LongTermGoal[];
        },
    });

    const createGoalMutation = useMutation({
        mutationFn: async (title: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const newGoal = {
                user_id: user.id,
                title,
                type: view,
                year: selectedYear,
                month: view !== 'annual' ? selectedMonth : null,
                week_number: view === 'weekly' ? selectedWeek : null,
                is_completed: false, // Default to false
            };

            const { data, error } = await supabase
                .from('long_term_goals')
                .insert(newGoal)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            setNewGoalTitle('');
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
            toast.success('Obiettivo creato!');
        },
        onError: (error) => {
            toast.error(`Errore durante la creazione: ${error.message}`);
        },
    });

    const toggleGoalMutation = useMutation({
        mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
            const { error } = await supabase
                .from('long_term_goals')
                .update({ is_completed })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
        },
    });

    const updateColorMutation = useMutation({
        mutationFn: async ({ id, color }: { id: string, color: string | null }) => {
            const { error } = await supabase.from('long_term_goals').update({ color }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
        },
        onError: () => {
            toast.error('Errore aggiornamento colore');
        }
    });

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('long_term_goals')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
            toast.success('Obiettivo eliminato');
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;
        createGoalMutation.mutate(newGoalTitle);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { exportBackup, importBackup, isExporting, isImporting } = useGoalBackup();

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await importBackup(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const months = [
        { value: 1, label: 'Gennaio' },
        { value: 2, label: 'Febbraio' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Aprile' },
        { value: 5, label: 'Maggio' },
        { value: 6, label: 'Giugno' },
        { value: 7, label: 'Luglio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Settembre' },
        { value: 10, label: 'Ottobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Dicembre' },
    ];


    // Generate year range: 2022 to (Current Year + 5)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: (currentYear + 5) - 2022 + 1 }, (_, i) => 2022 + i);

    return (
        <div className="space-y-6 animate-fade-in p-2 md:p-0">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Anno" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem
                                    key={year}
                                    value={year.toString()}
                                    className={cn(year < currentYear && "text-muted-foreground italic")}
                                >
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(view === 'monthly' || view === 'weekly') && (
                        <Select value={selectedMonth.toString()} onValueChange={(val) => {
                            setSelectedMonth(parseInt(val));
                            setSelectedWeek(1); // Reset week when month changes
                        }}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Mese" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => (
                                    <SelectItem
                                        key={m.value}
                                        value={m.value.toString()}
                                        className={cn(
                                            (selectedYear < currentYear || (selectedYear === currentYear && m.value < (new Date().getMonth() + 1))) && "text-muted-foreground italic"
                                        )}
                                    >
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {view === 'weekly' && (
                        <Select value={selectedWeek.toString()} onValueChange={(val) => setSelectedWeek(parseInt(val))}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Settimana" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: getWeeksInMonth(new Date(selectedYear, selectedMonth - 1, 1), { weekStartsOn: 1 }) }, (_, i) => i + 1).map(w => (
                                    <SelectItem
                                        key={w}
                                        value={w.toString()}
                                        // Logic for past weeks is complex without a full date compare, simplifying for now
                                        className={cn(
                                            (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < (new Date().getMonth() + 1))) && "text-muted-foreground italic"
                                        )}
                                    >
                                        Settimana {w}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex bg-secondary/50 p-1 rounded-lg gap-1 overflow-x-auto w-full md:w-auto">
                    <Button
                        variant={view === 'annual' ? "default" : "outline"}
                        onClick={() => setView('annual')}
                        className="whitespace-nowrap"
                    >
                        Annuale
                    </Button>
                    <Button
                        variant={view === 'monthly' ? "default" : "outline"}
                        onClick={() => setView('monthly')}
                        className="whitespace-nowrap"
                    >
                        Mensile
                    </Button>
                    <Button
                        variant={view === 'weekly' ? "default" : "outline"}
                        onClick={() => setView('weekly')}
                        className="whitespace-nowrap"
                    >
                        Settimanale
                    </Button>
                    <Button
                        variant={view === 'stats' ? "default" : "outline"}
                        onClick={() => setView('stats')}
                        className="whitespace-nowrap gap-2"
                    >
                        <PieChart className="w-4 h-4" />
                        Statistiche
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {/* Export Button */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Esporta Backup (JSON)">
                                <Download className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Stai per scaricare un backup completo (JSON) contenente TUTTI i tuoi obiettivi e le personalizzazioni delle categorie.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={exportBackup} disabled={isExporting}>
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Scarica Backup
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Import Button */}
                    <Button variant="outline" size="icon" title="Ripristina da Backup (JSON)" onClick={handleImportClick} disabled={isImporting}>
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json"
                        className="hidden"
                    />

                    {/* Settings Button */}
                    <GoalCategorySettingsDialog />
                </div>
            </div>

            {/* Title */}
            <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                {view === 'stats' ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Analytics {selectedYear}
                    </span>
                ) : (
                    <>
                        {view === 'annual' && <span className="text-primary">{selectedYear}</span>}
                        {view === 'monthly' && <span className="text-blue-400">{months.find(m => m.value === selectedMonth)?.label}</span>}
                        {view === 'weekly' && <span className="text-purple-400">Settimana {selectedWeek}</span>}
                        <span className="text-muted-foreground text-lg font-normal">
                            {view === 'annual' ? 'Obiettivi Annuali' : view === 'monthly' ? 'Obiettivi Mensili' : 'Obiettivi Settimanali'}
                        </span>
                    </>
                )}
            </div>


            {view === 'stats' ? (
                <MacroGoalsStats year={selectedYear} />
            ) : (
                <>
                    {/* Input */}
                    <form onSubmit={handleCreate} className="flex gap-2">
                        <Input
                            className="flex-1 bg-background/50"
                            placeholder={`Aggiungi obiettivo ${view === 'annual' ? 'annuale' : view === 'monthly' ? 'mensile' : 'settimanale'}...`}
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                        />
                        <Button type="submit" disabled={createGoalMutation.isPending}>
                            {createGoalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </form>

                    {/* List */}
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : goals?.length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-muted-foreground">
                                Nessun obiettivo impostato per questo periodo.
                            </div>
                        ) : (
                            goals?.map((goal, index) => {
                                const isFirstCompleted = goal.is_completed && (index === 0 || !goals[index - 1].is_completed);

                                return (
                                    <div key={goal.id}>
                                        {isFirstCompleted && index > 0 && (
                                            <div className="flex items-center gap-4 py-6">
                                                <div className="h-px bg-white/10 flex-1" />
                                                <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Completati</span>
                                                <div className="h-px bg-white/10 flex-1" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "group flex items-center gap-3 p-4 rounded-xl border transition-all",
                                                goal.is_completed
                                                    ? "opacity-60 bg-green-500/5 border-green-500/10"
                                                    : (getGoalColorClass(goal.color))
                                            )}
                                        >
                                            <Checkbox
                                                checked={goal.is_completed}
                                                onCheckedChange={(checked) => toggleGoalMutation.mutate({ id: goal.id, is_completed: checked as boolean })}
                                                className="w-5 h-5 border-white/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                            />
                                            <span className={cn(
                                                "flex-1 font-medium transition-all",
                                                goal.is_completed && "line-through text-muted-foreground"
                                            )}>
                                                {goal.title}
                                            </span>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Select
                                                    value={goal.color || "null"}
                                                    onValueChange={(val) => updateColorMutation.mutate({ id: goal.id, color: val === "null" ? null : val })}
                                                >
                                                    <SelectTrigger className="w-[30px] h-[30px] p-0 border-0 bg-transparent focus:ring-0">
                                                        <div className={cn("w-4 h-4 rounded-full", {
                                                            "bg-white/20": !goal.color,
                                                            "bg-rose-500": goal.color === 'red',
                                                            "bg-orange-500": goal.color === 'orange',
                                                            "bg-amber-400": goal.color === 'yellow',
                                                            "bg-blue-600": goal.color === 'blue',
                                                            "bg-violet-600": goal.color === 'purple',
                                                            "bg-fuchsia-500": goal.color === 'pink',
                                                            "bg-cyan-500": goal.color === 'cyan',
                                                        })} />
                                                    </SelectTrigger>
                                                    <SelectContent align="end">
                                                        <SelectItem value="null">Nessun Colore</SelectItem>
                                                        {colorOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {getLabel(opt.value)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                                                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

        </div>
    );
}
