import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, role, profile, loading, maintenanceMode } = useAuth()

    useEffect(() => {
        if (profile?.is_internal && role === 'consultant') {
            document.body.classList.add('theme-green');
        } else {
            document.body.classList.remove('theme-green');
        }
        return () => {
            document.body.classList.remove('theme-green');
        };
    }, [profile, role]);

    if (loading || (user && role === 'consultant' && !profile)) {
        return <div className="flex justify-center items-center h-screen">Chargement...</div>
    }

    // 🛠️ MAINTENANCE MODE CHECK
    // If maintenance is ON and user is NOT an admin, they go to maintenance page
    if (maintenanceMode && role !== 'admin') {

        return <Navigate to="/maintenance" replace />
    }

    if (!user) {
        let redirectPath = "/login"
        if (allowedRoles?.includes('admin')) redirectPath = "/admin-lsc-secure"
        else if (allowedRoles?.includes('consultant')) redirectPath = "/login?role=consultant"
        else if (allowedRoles?.includes('of')) redirectPath = "/login?role=client"

        return <Navigate to={redirectPath} replace />
    }

    // 🌍 DYNAMIC ROUTE REDIRECTION FOR INTERNAL USERS
    if (role === 'consultant') {
        const path = window.location.pathname;
        if (profile?.is_internal && path.startsWith('/consultant/')) {
            const newPath = path.replace(/^\/consultant\//, '/internal/');
            return <Navigate to={newPath + window.location.search + window.location.hash} replace />;
        }
        if (!profile?.is_internal && path.startsWith('/internal/')) {
            const newPath = path.replace(/^\/internal\//, '/consultant/');
            return <Navigate to={newPath + window.location.search + window.location.hash} replace />;
        }
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // 🔒 SAFETY: Give it one last check if role is null (fast login fix)
        if (role === null) return <div className="flex justify-center items-center h-screen">Vérification des accès...</div>

        // Redirect based on their actual role to avoid authorized access loops
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
        if (role === 'consultant') return <Navigate to="/consultant/dashboard" replace />
        if (role === 'of') return <Navigate to="/client/dashboard" replace />

        return <Navigate to="/unauthorized" replace />
    }

    return (
        <div key={window.location.pathname} className="animate-page-entry w-full h-full flex flex-col flex-1">
            <Outlet />
        </div>
    )
}

export default ProtectedRoute
