import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar as CalendarIcon, Loader2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

type GoalType = 'annual' | 'monthly' | 'weekly';

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
                month: view === 'annual' ? null : selectedMonth,
                week_number: view === 'weekly' ? selectedWeek : null,
            };

            const { error } = await supabase.from('long_term_goals').insert(newGoal);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
            setNewGoalTitle('');
            toast.success('Obiettivo aggiunto');
        },
        onError: (error) => {
            toast.error('Errore durante il salvataggio: ' + error.message);
        }
    });

    const toggleGoalMutation = useMutation({
        mutationFn: async ({ id, is_completed }: { id: string, is_completed: boolean }) => {
            const { error } = await supabase.from('long_term_goals').update({ is_completed }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
        },
        onError: () => {
            toast.error('Impossibile aggiornare lo stato');
        }
    });

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('long_term_goals').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
            toast.success('Obiettivo eliminato');
        },
        onError: () => {
            toast.error('Impossibile eliminare l\'obiettivo');
        }
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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;
        createGoalMutation.mutate(newGoalTitle);
    };

    const months = [
        { value: 1, label: 'Gennaio' }, { value: 2, label: 'Febbraio' },
        { value: 3, label: 'Marzo' }, { value: 4, label: 'Aprile' },
        { value: 5, label: 'Maggio' }, { value: 6, label: 'Giugno' },
        { value: 7, label: 'Luglio' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Settembre' }, { value: 10, label: 'Ottobre' },
        { value: 11, label: 'Novembre' }, { value: 12, label: 'Dicembre' }
    ];

    // Generate weeks for the selected month dynamically
    const weeksInMonth = getWeeksInMonth(new Date(selectedYear, selectedMonth - 1), { weekStartsOn: 1 });
    const weeks = Array.from({ length: weeksInMonth }, (_, i) => i + 1);

    // Generate years from 2022 to current year + 5
    const currentYear = new Date().getFullYear();
    const startYear = 2022;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    const handleExport = async () => {
        try {
            const { data: allGoals, error } = await supabase
                .from('long_term_goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const goals = allGoals as LongTermGoal[];

            if (!goals || goals.length === 0) {
                toast.error("Nessun dato da esportare");
                return;
            }

            const csvRows = ['ID,Title,Type,Year,Month,Week,Is Completed,Created At'];

            const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;

            goals.forEach(goal => {
                const row = [
                    goal.id,
                    escape(goal.title),
                    goal.type,
                    goal.year,
                    goal.month || '',
                    goal.week_number || '',
                    goal.is_completed ? 'TRUE' : 'FALSE',
                    goal.created_at
                ].join(',');
                csvRows.push(row);
            });

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `macro-goals-backup-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Backup completato!');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Errore durante il backup');
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const headers = lines[0].split(',');

                // Simple parser that respects quotes
                const parseCSVLine = (line: string) => {
                    const values = [];
                    let current = '';
                    let inQuotes = false;

                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            if (i + 1 < line.length && line[i + 1] === '"') {
                                // Escaped quote
                                current += '"';
                                i++;
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            values.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current);
                    return values;
                };

                const goalsToUpsert: any[] = [];
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) throw new Error("Utente non autenticato");

                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    // Expected order: ID, Title, Type, Year, Month, Week, Is Completed, Created At
                    // But relying on index is risky if format changes. For now we stick to our export format.

                    if (values.length < 4) continue; // Skip invalid rows

                    const id = values[0].trim();
                    // If ID is a valid UUID, use it. If it's effectively empty or new, Supabase upsert without ID usually needs ID for conflict.
                    // Logic: If ID exists in CSV, we use it to update. If we want to create new, we omit ID or generate new UUID.
                    // The requirement is "upload to update or add".
                    // If the CSV row has an ID, we assume it's an update to that ID.
                    // If the user intentionally cleared the ID in CSV to duplicate/create new, we shouldn't send an empty string as UUID.

                    const title = values[1];
                    const type = values[2] as GoalType;
                    const year = parseInt(values[3]);
                    const month = values[4] ? parseInt(values[4]) : null;
                    const week_number = values[5] ? parseInt(values[5]) : null;
                    const is_completed = values[6] === 'TRUE';
                    const created_at = values[7] ? values[7] : new Date().toISOString();

                    const goal: any = {
                        user_id: user.id,
                        title,
                        type,
                        year,
                        month,
                        week_number,
                        is_completed,
                        created_at
                    };

                    // Only add ID if it looks like a valid UUID (simple check length usually 36)
                    if (id && id.length > 30) {
                        goal.id = id;
                    }

                    goalsToUpsert.push(goal);
                }

                if (goalsToUpsert.length === 0) {
                    toast.error("Nessun dato valido trovato nel file CSV");
                    return;
                }

                const { error } = await supabase.from('long_term_goals').upsert(goalsToUpsert);

                if (error) throw error;

                toast.success(`${goalsToUpsert.length} obiettivi importati/aggiornati con successo`);
                queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });

                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch (error: any) {
                console.error('Import failed:', error);
                toast.error('Errore durante l\'importazione: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">

            {/* Filters/Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
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
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileUpload}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleImportClick}
                        title="Importa CSV"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Upload className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Backup Completo CSV"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Conferma Backup</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Stai per scaricare un file CSV contenente TUTTI i tuoi macro obiettivi (annuali, mensili, settimanali), inclusi quelli completati.
                                    <br /><br />
                                    Vuoi procedere?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={handleExport}>Scarica Backup</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem
                                    key={y}
                                    value={y.toString()}
                                    className={y < currentYear ? "text-muted-foreground italic" : "font-medium"}
                                >
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(view === 'monthly' || view === 'weekly') && (
                        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => {
                                    const currentMonth = new Date().getMonth() + 1;
                                    const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && m.value < currentMonth);
                                    return (
                                        <SelectItem
                                            key={m.value}
                                            value={m.value.toString()}
                                            className={isPastMonth ? "text-muted-foreground italic" : "font-medium"}
                                        >
                                            {m.label}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    )}

                    {view === 'weekly' && (
                        <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(parseInt(v))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {weeks.map(w => {
                                    const currentMonth = new Date().getMonth() + 1;
                                    const currentWeek = getWeekOfMonth(new Date(), { weekStartsOn: 1 });

                                    const isPastWeek = selectedYear < currentYear ||
                                        (selectedYear === currentYear && selectedMonth < currentMonth) ||
                                        (selectedYear === currentYear && selectedMonth === currentMonth && w < currentWeek);

                                    return (
                                        <SelectItem
                                            key={w}
                                            value={w.toString()}
                                            className={isPastWeek ? "text-muted-foreground italic" : "font-medium"}
                                        >
                                            Settimana {w}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Title */}
            <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                {view === 'annual' && <span className="text-primary">{selectedYear}</span>}
                {view === 'monthly' && <span className="text-blue-400">{months.find(m => m.value === selectedMonth)?.label}</span>}
                {view === 'weekly' && <span className="text-purple-400">Settimana {selectedWeek}</span>}
                <span className="text-muted-foreground text-lg font-normal">
                    {view === 'annual' ? 'Obiettivi Annuali' : view === 'monthly' ? 'Obiettivi Mensili' : 'Obiettivi Settimanali'}
                </span>
            </div>


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
                                            : (goalColors.find(c => c.value === goal.color)?.class || "bg-card/20 border-white/5 hover:bg-card/40")
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
                                                <SelectItem value="red">Rosso</SelectItem>
                                                <SelectItem value="orange">Arancione</SelectItem>
                                                <SelectItem value="yellow">Giallo</SelectItem>
                                                <SelectItem value="blue">Blu</SelectItem>
                                                <SelectItem value="purple">Viola</SelectItem>
                                                <SelectItem value="pink">Rosa</SelectItem>
                                                <SelectItem value="cyan">Ciano</SelectItem>
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

        </div>
    );
}
