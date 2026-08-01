import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CookieBanner from './components/CookieBanner'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminActivities from './pages/admin/AdminActivities'
import ConsultantDashboard from './pages/consultant/ConsultantDashboard'
import ConsultantCases from './pages/consultant/ConsultantCases'
import CaseDetails from './pages/consultant/CaseDetails'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProfile from './pages/client/ClientProfile'
import ClientReclamations from './pages/client/ClientReclamations'
import ClientQuestionnaires from './pages/client/ClientQuestionnaires'
import AgendaVisios from './pages/consultant/AgendaVisios'
import Ressources from './pages/consultant/Ressources'
import ConsultantNotifications from './pages/consultant/ConsultantNotifications'
import ConsultantMessages from './pages/consultant/ConsultantMessages'
import ConsultantBackups from './pages/consultant/ConsultantBackups'
import ConsultantReclamations from './pages/consultant/ConsultantReclamations'
import ConsultantQuestionnaires from './pages/consultant/ConsultantQuestionnaires'
import ConsultantActionsHistory from './pages/consultant/ConsultantActionsHistory'
import Profile from './pages/Profile'
import Unauthorized from './pages/Unauthorized'
import MaquetteDemo from './pages/MaquetteDemo'
import Maintenance from './pages/Maintenance'
import AuditQualiopi from './pages/consultant/AuditQualiopi'
import AuditPrototype from './pages/AuditPrototype/AuditQualiopi'
import ClientToastsHistory from './pages/client/ClientToastsHistory'

function App() {
  return (
    <AuthProvider>
      <Router>
        <CookieBanner />
        <Routes>
          {/* Secret Admin Login Route */}
          <Route path="/admin-lsc-secure" element={<Login forceRole="admin" />} />
          
          {/* Secret Internal Consultant Login Route */}
          <Route path="/internal-lsc-secure" element={<Login forceRole="internal" />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/maquette" element={<MaquetteDemo />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/audit-prototype" element={<AuditPrototype />} />

          {/* Shared Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/activities" element={<AdminActivities />} />
          </Route>

          {/* Consultant Routes */}
          <Route element={<ProtectedRoute allowedRoles={['consultant']} />}>
            <Route path="/consultant/dashboard" element={<ConsultantDashboard />} />
            <Route path="/consultant/cases" element={<ConsultantCases />} />
            <Route path="/consultant/case/:id" element={<CaseDetails />} />
            <Route path="/consultant/calendar" element={<AgendaVisios />} />
            <Route path="/consultant/resources" element={<Ressources />} />
            <Route path="/consultant/notifications" element={<ConsultantNotifications />} />
            <Route path="/consultant/actions-history" element={<ConsultantActionsHistory />} />
            <Route path="/consultant/messages" element={<ConsultantMessages />} />
            <Route path="/consultant/backups" element={<ConsultantBackups />} />
            <Route path="/consultant/reclamations" element={<ConsultantReclamations />} />
            <Route path="/consultant/questionnaires" element={<ConsultantQuestionnaires />} />
            <Route path="/consultant/audit/:id" element={<AuditQualiopi />} />
            <Route path="/consultant/audit" element={<AuditQualiopi />} />

            {/* Private Internal Routes */}
            <Route path="/internal/dashboard" element={<ConsultantDashboard />} />
            <Route path="/internal/cases" element={<ConsultantCases />} />
            <Route path="/internal/case/:id" element={<CaseDetails />} />
            <Route path="/internal/calendar" element={<AgendaVisios />} />
            <Route path="/internal/resources" element={<Ressources />} />
            <Route path="/internal/notifications" element={<ConsultantNotifications />} />
            <Route path="/internal/actions-history" element={<ConsultantActionsHistory />} />
            <Route path="/internal/messages" element={<ConsultantMessages />} />
            <Route path="/internal/backups" element={<ConsultantBackups />} />
            <Route path="/internal/reclamations" element={<ConsultantReclamations />} />
            <Route path="/internal/questionnaires" element={<ConsultantQuestionnaires />} />
            <Route path="/internal/audit/:id" element={<AuditQualiopi />} />
            <Route path="/internal/audit" element={<AuditQualiopi />} />
          </Route>

          {/* Client (OF) Routes - All point to Dashboard tabs */}
          <Route element={<ProtectedRoute allowedRoles={['of']} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/audit" element={<ClientDashboard />} />
            <Route path="/client/documents" element={<ClientDashboard />} />
            <Route path="/client/messages" element={<ClientDashboard />} />
            <Route path="/client/sessions" element={<ClientDashboard />} />
            <Route path="/client/criterion/:id" element={<ClientDashboard />} />
            <Route path="/client/profile" element={<ClientProfile />} />
            <Route path="/client/reclamations" element={<ClientReclamations />} />
            <Route path="/client/questionnaires" element={<ClientQuestionnaires />} />
            <Route path="/client/toasts-history" element={<ClientToastsHistory />} />
          </Route>

          {/* Default Route - Redirect logic could be here or inside Login */}
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
