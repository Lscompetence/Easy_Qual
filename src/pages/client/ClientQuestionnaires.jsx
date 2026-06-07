import { useState } from 'react'
import ClientSidebar from '../../components/client/ClientSidebar'
import ClientTopBar from '../../components/client/ClientTopBar'

export default function ClientQuestionnaires() {
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ClientSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <ClientTopBar
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[2000px] mx-auto">
                    <iframe 
                        src="/questionnaire-client.html" 
                        className="w-full h-full border-0 rounded-2xl shadow-sm bg-white" 
                        title="Questionnaire de satisfaction" 
                    />
                </main>
            </div>
        </div>
    )
}
