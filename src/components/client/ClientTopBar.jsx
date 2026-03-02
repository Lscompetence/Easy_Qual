import { useState, useEffect } from 'react'
import { Search, Bell, Menu, FileText, ChevronRight, MessageSquare } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ClientTopBar() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()

    return (
        <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white text-xl font-bold">
                    {profile?.commercial_name?.[0] || 'Q'}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{profile?.commercial_name || 'Mon Organisme'}</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Espace de Préparation Qualiopi</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-500 shadow-inner">
                    <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                    Dossier actif
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/client/messages')}
                        className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100 transition-all relative shadow-sm"
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 border-2 border-white rounded-full bg-red-500"></span>
                    </button>
                    <button className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100 transition-all relative shadow-sm">
                        <Bell className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}
