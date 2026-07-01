import { useState } from 'react'
import ConsultantSidebar from '../../components/consultant/ConsultantSidebar'
import ConsultantTopBar from '../../components/consultant/ConsultantTopBar'

export default function ConsultantQuestionnaires() {
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex text-slate-800">
            <ConsultantSidebar isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <ConsultantTopBar
                    showMobileMenu={showMobileMenu}
                    setShowMobileMenu={setShowMobileMenu}
                    showSearch={false}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[2000px] mx-auto">
                    <iframe 
                        src="/questionnaire-consultant.html" 
                        className="w-full h-full border-0 rounded-2xl shadow-sm bg-white" 
                        title="Questionnaire de satisfaction" 
                    />
                </main>
            </div>
        </div>
    )
}
