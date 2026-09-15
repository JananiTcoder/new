import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import RoleSelect from './pages/RoleSelect'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import HazardIntelligence from './pages/HazardIntelligence'
import Habitations from './pages/Habitations'
import HabitationDetail from './pages/HabitationDetail'
import Relocation from './pages/Relocation'
import SafeSites from './pages/SafeSites'
import Infrastructure from './pages/Infrastructure'
import RelocationPlanner from './pages/RelocationPlanner'
import RouteIntelligence from './pages/RouteIntelligence'
import PlannerDetails from './pages/relocation-planner/PlannerDetails'
import ChooseSite from './pages/relocation-planner/ChooseSite'
import OperationStatusPage from './pages/relocation-planner/OperationStatusPage'
import RescueTeam from './pages/RescueTeam'
import Validation from './pages/Validation'
import OperationManagement from './pages/OperationManagement'
import OperationDetail from './pages/OperationDetail'
import Institution from './pages/Institution'
import WhatIf from './pages/WhatIf'
import AuditTrail from './pages/AuditTrail'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import NationalRelocations from './pages/NationalRelocations'
import ResourceNetwork from './pages/ResourceNetwork'
import { RequireSession, RoleRoute } from './auth/ProtectedRoute'
import ProviderLogin from './pages/provider/ProviderLogin'
import ProviderSignup from './pages/provider/ProviderSignup'
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderProfile from './pages/provider/ProviderProfile'
import ProviderCapacity from './pages/provider/ProviderCapacity'
import ProviderResources from './pages/provider/ProviderResources'
import ProviderSubmissions from './pages/provider/ProviderSubmissions'
import ProviderLayout from './provider/ProviderLayout'
import { RequireProviderSession } from './provider/ProviderProtectedRoute'
import { useAuth } from './auth/AuthContext'
import { ROLES } from './auth/roleConfig'
import CitizenOverview from './pages/citizen/CitizenOverview'
import CitizenSafeSites from './pages/citizen/CitizenSafeSites'
import CitizenSafeSiteDetail from './pages/citizen/CitizenSafeSiteDetail'
import CitizenRoutes from './pages/citizen/CitizenRoutes'
import CitizenAlerts from './pages/citizen/CitizenAlerts'
import EmergencySOS from './pages/citizen/EmergencySOS'
import ReportIssue from './pages/citizen/ReportIssue'
import VolunteerOverview from './pages/volunteer/VolunteerOverview'
import VolunteerRoute from './pages/volunteer/VolunteerRoute'
import VolunteerTasks from './pages/volunteer/VolunteerTasks'
import VolunteerTaskDetail from './pages/volunteer/VolunteerTaskDetail'
import VolunteerPeople from './pages/volunteer/VolunteerPeople'
import ReportIncident from './pages/volunteer/ReportIncident'
import VolunteerSOS from './pages/volunteer/VolunteerSOS'

// The Citizen Portal gets its own dedicated, simplified components at the
// SAME routes every other role already uses — this keeps routing/bookmarks
// identical while guaranteeing the Authority/Coordinator/Volunteer pages
// (Dashboard/SafeSites/RouteIntelligence/Alerts) render exactly as before.
function OverviewRoute() {
  const { role } = useAuth()
  if (role === ROLES.CITIZEN) return <CitizenOverview />
  if (role === ROLES.VOLUNTEERS) return <VolunteerOverview />
  return <Dashboard />
}
function SafeSitesRoute() {
  const { role } = useAuth()
  return role === ROLES.CITIZEN ? <CitizenSafeSites /> : <SafeSites />
}
function RoutesRoute() {
  const { role } = useAuth()
  if (role === ROLES.CITIZEN) return <CitizenRoutes />
  if (role === ROLES.VOLUNTEERS) return <VolunteerRoute />
  return <RelocationPlanner />
}
function AlertsRoute() {
  const { role } = useAuth()
  return role === ROLES.CITIZEN ? <CitizenAlerts /> : <Alerts />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/role-select" element={<RoleSelect />} />
      <Route
        path="/app"
        element={
          <RequireSession>
            <DashboardLayout />
          </RequireSession>
        }
      >
        <Route index element={<OverviewRoute />} />
        <Route
          path="hazard-intelligence"
          element={
            <RoleRoute pageId="hazard">
              <HazardIntelligence />
            </RoleRoute>
          }
        />
        <Route
          path="habitations"
          element={
            <RoleRoute pageId="habitations">
              <Habitations />
            </RoleRoute>
          }
        />
        <Route
          path="habitations/:id"
          element={
            <RoleRoute pageId="habitations">
              <HabitationDetail />
            </RoleRoute>
          }
        />
        <Route
          path="relocation"
          element={
            <RoleRoute pageId="relocation">
              <Relocation />
            </RoleRoute>
          }
        />
        <Route
          path="safe-sites"
          element={
            <RoleRoute pageId="sites">
              <SafeSitesRoute />
            </RoleRoute>
          }
        />
        <Route
          path="safe-sites/:id"
          element={
            <RoleRoute pageId="sites">
              <CitizenSafeSiteDetail />
            </RoleRoute>
          }
        />
        <Route
          path="infrastructure"
          element={
            <RoleRoute pageId="infrastructure">
              <Infrastructure />
            </RoleRoute>
          }
        />
        <Route
          path="routes"
          element={
            <RoleRoute pageId="routes">
              <RoutesRoute />
            </RoleRoute>
          }
        />
        {/* Legacy point-to-point route lookup — kept separate from the
            Relocation Planner above so Institution.jsx's setRouteOriginOverride
            and NationalRelocations.jsx's setCustomRoute hand-offs (arbitrary
            named origin/destination pairs that aren't necessarily a real
            tracked habitation) keep working exactly as before. */}
        <Route
          path="routes/lookup"
          element={
            <RoleRoute pageId="routes-plan">
              <RouteIntelligence />
            </RoleRoute>
          }
        />
        <Route
          path="routes/details"
          element={
            <RoleRoute pageId="routes-plan">
              <PlannerDetails />
            </RoleRoute>
          }
        />
        <Route
          path="routes/choose-site"
          element={
            <RoleRoute pageId="routes-plan">
              <ChooseSite />
            </RoleRoute>
          }
        />
        <Route
          path="routes/operation-status/:habitationId"
          element={
            <RoleRoute pageId="routes-plan">
              <OperationStatusPage />
            </RoleRoute>
          }
        />
        <Route
          path="relocation/team"
          element={
            <RoleRoute pageId="relocation-team">
              <RescueTeam />
            </RoleRoute>
          }
        />
        <Route
          path="relocation/validate"
          element={
            <RoleRoute pageId="relocation-validate">
              <Validation />
            </RoleRoute>
          }
        />
        <Route
          path="operations"
          element={
            <RoleRoute pageId="operations">
              <OperationManagement />
            </RoleRoute>
          }
        />
        <Route
          path="operations/:habitationId"
          element={
            <RoleRoute pageId="operations">
              <OperationDetail />
            </RoleRoute>
          }
        />
        <Route
          path="institution"
          element={
            <RoleRoute pageId="evacuation">
              <Institution />
            </RoleRoute>
          }
        />
        <Route
          path="what-if"
          element={
            <RoleRoute pageId="whatif">
              <WhatIf />
            </RoleRoute>
          }
        />
        <Route
          path="alerts"
          element={
            <RoleRoute pageId="alerts">
              <AlertsRoute />
            </RoleRoute>
          }
        />
        <Route
          path="report-issue"
          element={
            <RoleRoute pageId="report-issue">
              <ReportIssue />
            </RoleRoute>
          }
        />
        <Route
          path="emergency"
          element={
            <RoleRoute pageId="emergency-sos">
              <EmergencySOS />
            </RoleRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <RoleRoute pageId="tasks">
              <VolunteerTasks />
            </RoleRoute>
          }
        />
        <Route
          path="tasks/:id"
          element={
            <RoleRoute pageId="tasks">
              <VolunteerTaskDetail />
            </RoleRoute>
          }
        />
        <Route
          path="people"
          element={
            <RoleRoute pageId="people">
              <VolunteerPeople />
            </RoleRoute>
          }
        />
        <Route
          path="report-incident"
          element={
            <RoleRoute pageId="report-incident">
              <ReportIncident />
            </RoleRoute>
          }
        />
        <Route
          path="volunteer-sos"
          element={
            <RoleRoute pageId="volunteer-sos">
              <VolunteerSOS />
            </RoleRoute>
          }
        />
        <Route
          path="audit-trail"
          element={
            <RoleRoute pageId="audit">
              <AuditTrail />
            </RoleRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleRoute pageId="settings">
              <Settings />
            </RoleRoute>
          }
        />
        <Route
          path="national-relocations"
          element={
            <RoleRoute pageId="national-relocations">
              <NationalRelocations />
            </RoleRoute>
          }
        />
        <Route
          path="resource-network"
          element={
            <RoleRoute pageId="resource-network">
              <ResourceNetwork />
            </RoleRoute>
          }
        />
      </Route>

      {/* Resource & Infrastructure Provider portal — a separate auth flow from the
          four role-based portals above (see src/provider/ProviderAuthContext.jsx). */}
      <Route path="/provider/login" element={<ProviderLogin />} />
      <Route path="/provider/signup" element={<ProviderSignup />} />
      <Route
        path="/provider"
        element={
          <RequireProviderSession>
            <ProviderLayout />
          </RequireProviderSession>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="capacity" element={<ProviderCapacity />} />
        <Route path="resources" element={<ProviderResources />} />
        <Route path="submissions" element={<ProviderSubmissions />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
