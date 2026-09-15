import { useAppState } from '../../state/AppStateContext'
import { hazardZones } from '../../data/hazards'

// Single source of truth for "which habitation is the Relocation Planner
// currently talking about" across /app/routes and its nested pages — reuses
// the same selectedHabitationId + habitations[0] fallback every other guided
// page (Relocation.jsx, RescueTeam.jsx, RouteIntelligence.jsx) already relies
// on, so a refresh never produces a blank page.
export function usePlannerHabitation() {
  const appState = useAppState()
  const { habitations, selectedHabitationId, getOperationForHabitation } = appState
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = habitation ? getOperationForHabitation(habitation.id) : null
  const relevantHazardZones = habitation ? hazardZones.filter((z) => habitation.hazards.includes(z.type)) : []

  return { ...appState, habitation, operation, relevantHazardZones }
}
