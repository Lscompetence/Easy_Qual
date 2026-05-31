import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Calendar, Clock, Eraser, Check } from 'lucide-react';

export default function SignatureModal({ isOpen, onClose, onConfirm, eventDetails, role }) {
    const sigCanvas = useRef({});
    const [name, setName] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (isOpen && eventDetails) {
            const dateObj = new Date(eventDetails.event_date || Date.now());
            setDateStr(dateObj.toISOString().split('T')[0]);
            setStartTime(dateObj.toTimeString().slice(0, 5));
            // Default end time to +1 hour
            const endDate = new Date(dateObj.getTime() + 60 * 60 * 1000);
            setEndTime(endDate.toTimeString().slice(0, 5));
            setName(role === 'consultant' ? 'Consultant' : 'Bénéficiaire'); // Can be passed as prop if available
        }
    }, [isOpen, eventDetails, role]);

    const handleClear = () => {
        sigCanvas.current.clear();
    };

    const handleConfirm = () => {
        try {
            if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
                alert('Veuillez signer avant de confirmer.');
                return;
            }

            if (!name || !dateStr || !startTime || !endTime) {
                alert('Veuillez remplir tous les champs obligatoires.');
                return;
            }

            const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            
            onConfirm({
                name,
                date: dateStr,
                startTime,
                endTime,
                signatureData: dataURL,
                role
            });
        } catch (err) {
            console.error("Signature processing error:", err);
            alert("Erreur lors du traitement de la signature: " + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        Émarger la présence
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Veuillez confirmer votre présence pour la séance du {new Date(dateStr).toLocaleDateString('fr-FR')}.
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nom et prénom <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date d'émargement <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateStr}
                                onChange={e => setDateStr(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Heure début <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Heure fin <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Signature <span className="text-red-500">*</span></label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative group">
                            <SignatureCanvas
                                penColor="black"
                                canvasProps={{ className: 'w-full h-32 cursor-crosshair' }}
                                ref={sigCanvas}
                            />
                            <button
                                onClick={handleClear}
                                className="absolute bottom-2 right-2 px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                            >
                                <Eraser className="h-3 w-3" /> Effacer
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-indigo-900 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-800 transition-colors flex items-center gap-2"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
