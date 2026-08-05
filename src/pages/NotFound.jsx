import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-gray-100 text-center animate-page-entry">
                <div className="flex justify-center mb-8">
                    <Logo size="large" />
                </div>
                <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
                <p className="text-lg font-bold text-gray-900 mb-1">Page introuvable</p>
                <p className="text-sm text-gray-500 mb-8">
                    La page que vous recherchez n'existe pas ou a été déplacée.
                </p>
                <Link
                    to="/login"
                    className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                >
                    Retour à la connexion
                </Link>
            </div>
        </div>
    )
}
