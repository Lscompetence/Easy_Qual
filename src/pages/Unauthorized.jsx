import { Link } from 'react-router-dom'

export default function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <h1 className="text-4xl font-extrabold text-red-600">403</h1>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Accès Refusé</h2>
                <p className="mt-2 text-gray-600">Vous n'avez pas la permission d'accéder à cette page.</p>
                <div className="mt-6">
                    <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    )
}
