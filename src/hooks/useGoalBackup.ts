import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GoalCategorySettings } from './useGoalCategories';

export interface BackupData {
    version: number;
    timestamp: string;
    goals: any[];
    settings: GoalCategorySettings | null;
}

export function useGoalBackup() {
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const exportBackup = async () => {
        setIsExporting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Fetch Goals
            const { data: goals, error: goalsError } = await supabase
                .from('long_term_goals')
                .select('*')
                .eq('user_id', user.id);

            if (goalsError) throw goalsError;

            // 2. Fetch Settings
            const { data: settings, error: settingsError } = await supabase
                .from('goal_category_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                throw settingsError;
            }

            // 3. Bundle Data
            const backupData: BackupData = {
                version: 1,
                timestamp: new Date().toISOString(),
                goals: goals || [],
                settings: settings || null
            };

            // 4. Download File
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `habit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Backup scaricato con successo');
        } catch (error: any) {
            console.error('Export failed:', error);
            toast.error(`Errore durante l'export: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const importBackup = async (file: File) => {
        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) return;

                const backup: BackupData = JSON.parse(text);

                // Basic Validation
                if (!backup.version || !Array.isArray(backup.goals)) {
                    throw new Error('Formato file non valido');
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                let successCount = 0;
                let errorCount = 0;

                // 1. Restore Goals (Upsert)
                if (backup.goals.length > 0) {
                    const goalsToUpsert = backup.goals.map(g => ({
                        ...g,
                        user_id: user.id // Force ownership
                    }));

                    const { error: goalsError } = await supabase
                        .from('long_term_goals')
                        .upsert(goalsToUpsert);

                    if (goalsError) {
                        console.error('Goals import error:', goalsError);
                        errorCount += backup.goals.length;
                    } else {
                        successCount = backup.goals.length;
                    }
                }

                // 2. Restore Settings
                if (backup.settings) {
                    // Check if exists
                    const { data: existing } = await supabase
                        .from('goal_category_settings')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();

                    const settingsData = {
                        user_id: user.id,
                        mappings: backup.settings.mappings
                    };

                    if (existing) {
                        await supabase
                            .from('goal_category_settings')
                            .update({ mappings: settingsData.mappings })
                            .eq('id', existing.id);
                    } else {
                        await supabase
                            .from('goal_category_settings')
                            .insert(settingsData);
                    }
                }

                queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
                queryClient.invalidateQueries({ queryKey: ['goalCategorySettings'] });

                toast.success(`Ripristino completato: ${successCount} obiettivi importati.`);

            } catch (error: any) {
                console.error('Import failed:', error);
                toast.error(`Errore durante l'importazione: ${error.message || 'File non valido'}`);
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
    };

    return {
        exportBackup,
        importBackup,
        isExporting,
        isImporting
    };
}
