/* eslint-disable */
import { useState, useEffect } from 'react';
import { X, ToggleLeft, ToggleRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  admin: 'Administrateur',
  consultant: 'Consultant',
  of: 'Client',
};

const getConsentKey = (role) => `easyqual_cookie_consent_session_${role}`;

const CookieBanner = () => {
  const { role, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  useEffect(() => {
    if (!role) return;
    const consent = sessionStorage.getItem(getConsentKey(role));
    if (!consent) {
      setIsVisible(true);
    }
  }, [role]);

  const handleAcceptAll = () => {
    if (!role) return;
    sessionStorage.setItem(getConsentKey(role), 'accepted');
    setIsVisible(false);
    setShowModal(false);
  };

  const handleSaveSettings = () => {
    if (!role) return;
    sessionStorage.setItem(getConsentKey(role), 'accepted');
    setIsVisible(false);
    setShowModal(false);
  };

  const path = window.location.pathname;
  const isLoginRoute = path === '/login' || path === '/internal-lsc-secure' || path === '/admin-lsc-secure' || path === '/';

  if (!isVisible || !role || isLoginRoute) return null;

  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <>
      {/* ── MODALE PARAMÈTRES (style Slack) ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl shadow-md shadow-blue-600/20">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Easy'Qual</p>
                  <h2 className="text-base font-black text-gray-900 leading-tight">Gestion des cookies</h2>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-7 py-5">
              <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                Nous utilisons des cookies sur notre plateforme pour sécuriser votre session{' '}
                <span className="font-bold text-gray-700">{roleLabel}</span>.
                Les cookies essentiels sont indispensables au fonctionnement de la plateforme et ne peuvent pas être désactivés.
              </p>

              {/* Bouton Accepter tout */}
              <button
                onClick={handleAcceptAll}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] mb-6"
              >
                ACCEPTER TOUS LES COOKIES
              </button>

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Gérer les préférences
              </p>

              {/* Catégorie 1 : Essentiels (toujours actif) */}
              <div className="border border-gray-100 rounded-2xl p-5 mb-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-black text-gray-900">Cookies essentiels</h3>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                    Toujours actifs
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Les cookies essentiels sont indispensables au fonctionnement de la plateforme.
                  Il s'agit par exemple du cookie de session <span className="font-mono font-bold text-gray-600">easyqual-auth-token</span>,
                  nécessaire à l'affichage du site, à l'authentification et à la sécurité.
                </p>
                <div className="mt-3 flex items-center gap-2 bg-white rounded-xl p-2.5 border border-blue-50">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-gray-800">easyqual-auth-token</p>
                    <p className="text-[10px] text-gray-400 font-medium">Cookie de session sécurisé · SameSite=Lax · Secure</p>
                  </div>
                </div>
              </div>

              {/* Catégorie 2 : Fonctionnels (toggle) */}
              <div className="border border-gray-100 rounded-2xl p-5 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-gray-900">Cookies fonctionnels</h3>
                  <button
                    onClick={() => setFunctionalEnabled(!functionalEnabled)}
                    className="transition-all focus:outline-none"
                    aria-label="Toggle cookies fonctionnels"
                  >
                    {functionalEnabled ? (
                      <div className="w-11 h-6 bg-blue-600 rounded-full flex items-center px-1 transition-all">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm transition-all" />
                      </div>
                    ) : (
                      <div className="w-11 h-6 bg-gray-200 rounded-full flex items-center px-1 transition-all">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm transition-all" />
                      </div>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Ces cookies améliorent les fonctionnalités de la plateforme, comme mémoriser vos préférences
                  d'affichage et personnaliser votre expérience de navigation.
                </p>
              </div>

              {/* Catégorie 3 : Publicitaires (toujours OFF) */}
              <div className="border border-gray-100 rounded-2xl p-5 mb-6 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-gray-900">Cookies publicitaires</h3>
                  <div className="w-11 h-6 bg-gray-200 rounded-full flex items-center px-1">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Easy'Qual n'utilise <span className="font-bold text-gray-600">aucun cookie publicitaire</span>. Aucune donnée n'est partagée avec des tiers à des fins publicitaires.
                </p>
              </div>

              {/* Bouton Enregistrer */}
              <button
                onClick={handleSaveSettings}
                className="w-full py-3.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-sm rounded-xl transition-all"
              >
                ENREGISTRER LES PARAMÈTRES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRE EN BAS (style Slack) ───────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">

          {/* Texte */}
          <p className="text-xs text-gray-500 leading-relaxed font-medium flex-1">
            Nous utilisons des cookies pour sécuriser votre session{' '}
            <span className="font-bold text-gray-700">{roleLabel}</span> sur Easy'Qual.
            Ces cookies sont essentiels au bon fonctionnement de la plateforme.
            Pour plus d'informations,{' '}
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:underline font-bold"
            >
              consultez notre politique de confidentialité
            </button>
            . Si vous souhaitez modifier vos préférences, utilisez l'outil de{' '}
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:underline font-bold"
            >
              gestion des cookies
            </button>.
          </p>

          {/* Boutons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 font-black text-xs rounded-lg transition-all whitespace-nowrap uppercase tracking-wide"
            >
              Paramètres des cookies
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-lg transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap uppercase tracking-wide"
            >
              Autoriser tous les cookies
            </button>
          </div>
        </div>
      </div>

      {/* Espace en bas pour ne pas cacher le contenu */}
      <div className="h-20 sm:h-16" />
    </>
  );
};

export default CookieBanner;
