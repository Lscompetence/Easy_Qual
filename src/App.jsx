import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CookieBanner from './components/CookieBanner'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import ConsultantDashboard from './pages/consultant/ConsultantDashboard'
import ConsultantCases from './pages/consultant/ConsultantCases'
import CaseDetails from './pages/consultant/CaseDetails'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProfile from './pages/client/ClientProfile'
import AgendaVisios from './pages/consultant/AgendaVisios'
import Ressources from './pages/consultant/Ressources'
import ConsultantNotifications from './pages/consultant/ConsultantNotifications'
import ConsultantMessages from './pages/consultant/ConsultantMessages'
import ConsultantBackups from './pages/consultant/ConsultantBackups'
import Profile from './pages/Profile'
import Unauthorized from './pages/Unauthorized'
import MaquetteDemo from './pages/MaquetteDemo'
import Maintenance from './pages/Maintenance'

function App() {
  return (
    <AuthProvider>
      <Router>
        <CookieBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/maquette" element={<MaquetteDemo />} />
          <Route path="/maintenance" element={<Maintenance />} />

          {/* Shared Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Consultant Routes */}
          <Route element={<ProtectedRoute allowedRoles={['consultant']} />}>
            <Route path="/consultant/dashboard" element={<ConsultantDashboard />} />
            <Route path="/consultant/cases" element={<ConsultantCases />} />
            <Route path="/consultant/case/:id" element={<CaseDetails />} />
            <Route path="/consultant/calendar" element={<AgendaVisios />} />
            <Route path="/consultant/resources" element={<Ressources />} />
            <Route path="/consultant/notifications" element={<ConsultantNotifications />} />
            <Route path="/consultant/messages" element={<ConsultantMessages />} />
            <Route path="/consultant/backups" element={<ConsultantBackups />} />
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
          </Route>

          {/* Default Route - Redirect logic could be here or inside Login */}
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
