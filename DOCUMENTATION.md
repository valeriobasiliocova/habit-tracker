# DOCUMENTATION - Macro Obiettivi: Statistiche "All Time"

## Panoramica
Implementata la funzionalità per visualizzare le statistiche aggregate "Dal 2022" (inizio inserimenti) fino alla data corrente nella pagina Macro Obiettivi. Questo permette di analizzare le performance a lungo termine oltre alla singola annualità.

## Componenti Modificati

### 1. `src/components/goals/LongTermGoals.tsx`
*   **Gestione Stato Anno**: Modificato lo stato `selectedYear` da `number` a `string` per supportare il valore speciale `'all'`.
*   **UI Selettore**: Aggiunta l'opzione "Dal 2022" in cima alla lista degli anni.
*   **Logica Query**: Aggiornato il filtraggio per gestire `'all'` (seleziona default anno corrente per creazione, ma visualizza tutto per stats).
*   **Backup**: Gestito il caso `'all'` per l'export (default all'anno corrente se scope è 'year').
*   **Vista di Default**: La pagina si apre automaticamente sulla **Vista Settimanale (Corrente)**, calcolando dinamicamente la settimana in corso, per focalizzare l'utente sull'operatività immediata.

### 2. `src/components/goals/MacroGoalsStats.tsx`
*   **Interfaccia Props**: Aggiornata `MacroGoalsStatsProps` per accettare `year: number | string`.
*   **Definizione Tipi**: Aggiunte interfacce `LongTermGoal` e `GoalType` mancanti per risolvere errori TypeScript e inferenza Supabase.
*   **Query Dati**:
    *   Se `year === 'all'`, la query ora recupera tutti gli obiettivi con `year >= 2022`.
*   **Elaborazione Dati (Timeline)**:
    *   Implementata logica condizionale per generare i dati del grafico.
    *   **Anno Singolo**: Genera 12 mesi (Gen-Dic).
    *   **All Time**: Genera una timeline continua da Gen 2022 fino a Dicembre dell'anno corrente.
    *   L'asse X del grafico ora mostra "Mese 'AA" (es. "Gen '23") per distinguere gli anni.
*   **KPI**: I KPI (Totale, Completati, Successo) ora calcolano le aggregazioni su tutto il periodo selezionato.

## Dettagli Tecnici
*   **Retrocompatibilità**: La gestione dei mesi futuri/passati è dinamica. In modalità "All Time", i grafici mostrano l'evoluzione progressiva attraverso gli anni.
*   **Efficienza**: La visualizzazione "Velocity" (Velocità di Esecuzione) è stata adattata per mostrare l'accumulo cumulativo su più anni, offrendo una visione chiara della progressione a lungo termine.

## Note per il Deploy
Nessuna migrazione database richiesta. Le modifiche sono puramente frontend.
