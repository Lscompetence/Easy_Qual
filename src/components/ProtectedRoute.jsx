import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, role, loading } = useAuth()

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Chargement...</div>
    }

    if (!user) {
        let redirectPath = "/login"
        if (allowedRoles?.includes('admin')) redirectPath = "/login?role=admin"
        else if (allowedRoles?.includes('consultant')) redirectPath = "/login?role=consultant"
        else if (allowedRoles?.includes('of')) redirectPath = "/login?role=client"

        return <Navigate to={redirectPath} replace />
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect based on their actual role to avoid authorized access loops
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
        if (role === 'consultant') return <Navigate to="/consultant/dashboard" replace />
        if (role === 'of') return <Navigate to="/client/dashboard" replace />

        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
