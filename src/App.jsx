import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import ConsultantDashboard from './pages/consultant/ConsultantDashboard'
import ConsultantCases from './pages/consultant/ConsultantCases'
import CaseDetails from './pages/consultant/CaseDetails'
import ClientDashboard from './pages/client/ClientDashboard'
import AgendaVisios from './pages/consultant/AgendaVisios'
import Profile from './pages/Profile'
import Unauthorized from './pages/Unauthorized'
import MaquetteDemo from './pages/MaquetteDemo'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/maquette" element={<MaquetteDemo />} />

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
          </Route>

          {/* Client (OF) Routes */}
          <Route element={<ProtectedRoute allowedRoles={['of']} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* Default Route - Redirect logic could be here or inside Login */}
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
