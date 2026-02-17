import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pill,
  Clock,
  Check,
  Trash2,
  Bell,
  X,
  Calendar,
  Hash,
  Infinity,
  Camera,
  Share2,
  History,
  ClipboardCopy,
} from 'lucide-react';

const App = () => {
  // Estado para la lista de medicamentos
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: 'Amoxicilina',
      dosage: '500mg',
      frequency: 8, // horas
      lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      durationType: 'days',
      durationTotal: 7,
      pillsTaken: 6,
      image: null,
    },
    {
      id: 2,
      name: 'Ibuprofeno',
      dosage: '400mg',
      frequency: 12, // horas
      lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      durationType: 'pills',
      durationTotal: 10,
      pillsTaken: 2,
      image: null,
    },
  ]);

  // Historial de tomas (inicializado con datos de ejemplo)
  const [history, setHistory] = useState([
    {
      medName: 'Amoxicilina',
      dosage: '500mg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      medName: 'Ibuprofeno',
      dosage: '400mg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
    },
    {
      medName: 'Amoxicilina',
      dosage: '500mg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 8,
    durationType: 'indefinite',
    durationTotal: '',
    image: null,
  });

  const fileInputRef = useRef(null);
  const [notificationPermission, setNotificationPermission] =
    useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      });
    }
  };

  const getNextDoseTime = (lastTaken, frequencyHours) => {
    const last = new Date(lastTaken);
    return new Date(last.getTime() + frequencyHours * 60 * 60 * 1000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatus = (nextDose) => {
    const now = new Date();
    const diff = nextDose - now;
    const diffHours = diff / (1000 * 60 * 60);

    if (diff < 0) return 'late';
    if (diffHours < 1) return 'soon';
    return 'future';
  };

  const isTreatmentFinished = (med) => {
    if (med.durationType === 'indefinite') return false;

    if (med.durationType === 'pills') {
      return med.pillsTaken >= med.durationTotal;
    }

    if (med.durationType === 'days') {
      const start = new Date(med.startDate);
      const end = new Date(
        start.getTime() + med.durationTotal * 24 * 60 * 60 * 1000
      );
      return new Date() > end;
    }
    return false;
  };

  const getProgressText = (med) => {
    if (med.durationType === 'indefinite') return 'Tratamiento continuo';

    if (med.durationType === 'pills') {
      return `${med.pillsTaken} de ${med.durationTotal} tomas`;
    }

    if (med.durationType === 'days') {
      const start = new Date(med.startDate);
      const now = new Date();
      const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
      const total = med.durationTotal;
      return daysPassed > total
        ? 'Finalizado'
        : `Día ${daysPassed} de ${total}`;
    }
  };

  const getProgressPercent = (med) => {
    if (med.durationType === 'indefinite') return 100;

    if (med.durationType === 'pills') {
      return Math.min(100, (med.pillsTaken / med.durationTotal) * 100);
    }

    if (med.durationType === 'days') {
      const start = new Date(med.startDate);
      const now = new Date();
      const totalMillis = med.durationTotal * 24 * 60 * 60 * 1000;
      const elapsed = now - start;
      return Math.min(100, (elapsed / totalMillis) * 100);
    }
    return 0;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMed({ ...newMed, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const takeMedication = (id) => {
    const now = new Date().toISOString();

    // Actualizar medicamento
    const updatedMeds = medications.map((med) => {
      if (med.id === id) {
        // Agregar al historial
        setHistory((prev) => [
          {
            medName: med.name,
            dosage: med.dosage,
            timestamp: now,
          },
          ...prev,
        ]);

        return {
          ...med,
          lastTaken: now,
          pillsTaken: (med.pillsTaken || 0) + 1,
        };
      }
      return med;
    });
    setMedications(updatedMeds);
  };

  const deleteMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;

    const med = {
      id: Date.now(),
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: Number(newMed.frequency),
      lastTaken: new Date().toISOString(),
      startDate: new Date().toISOString(),
      durationType: newMed.durationType,
      durationTotal: Number(newMed.durationTotal) || 0,
      pillsTaken: 0,
      image: newMed.image,
    };

    setMedications([...medications, med]);
    setNewMed({
      name: '',
      dosage: '',
      frequency: 8,
      durationType: 'indefinite',
      durationTotal: '',
      image: null,
    });
    setShowAddModal(false);
  };

  // Función para compartir
  const shareMedications = () => {
    let text = '📋 *Mi plan de medicamentos:*\n\n';

    sortedMedications.forEach((med) => {
      if (isTreatmentFinished(med)) return;
      const nextDose = getNextDoseTime(med.lastTaken, med.frequency);
      text += `💊 *${med.name}* (${med.dosage})\n`;
      text += `⏱️ Cada ${med.frequency}h\n`;
      text += `📅 Próxima: ${formatTime(nextDose)}\n\n`;
    });

    text += 'Enviado desde Mi Pastillero App';

    if (navigator.share) {
      navigator
        .share({
          title: 'Mis Medicamentos',
          text: text,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  const sortedMedications = [...medications].sort((a, b) => {
    const finishedA = isTreatmentFinished(a);
    const finishedB = isTreatmentFinished(b);
    if (finishedA && !finishedB) return 1;
    if (!finishedA && finishedB) return -1;

    const nextA = getNextDoseTime(a.lastTaken, a.frequency);
    const nextB = getNextDoseTime(b.lastTaken, b.frequency);
    return nextA - nextB;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Pill size={120} />
        </div>

        {/* Top Actions Bar */}
        <div className="relative z-20 flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Mi Pastillero</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-blue-500 hover:bg-blue-400 p-2 rounded-full transition-colors"
              aria-label="Ver Historial"
            >
              <History size={20} />
            </button>
            <button
              onClick={shareMedications}
              className="bg-blue-500 hover:bg-blue-400 p-2 rounded-full transition-colors"
              aria-label="Compartir medicamentos"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-100 text-sm opacity-90">
            {new Date().toLocaleDateString([], {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>

          <div className="mt-6 flex justify-between items-end">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">
                Próxima toma
              </p>
              <p className="text-3xl font-bold">
                {medications.length > 0 &&
                !isTreatmentFinished(sortedMedications[0])
                  ? formatTime(
                      getNextDoseTime(
                        sortedMedications[0].lastTaken,
                        sortedMedications[0].frequency
                      )
                    )
                  : '--:--'}
              </p>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="bg-blue-500 hover:bg-blue-400 text-white text-xs py-2 px-3 rounded-full flex items-center gap-1 transition-colors"
              >
                <Bell size={14} /> Activar avisos
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto space-y-4">
        {medications.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Pill className="mx-auto mb-4 text-slate-300" size={64} />
            <p className="text-lg">No hay medicamentos.</p>
            <p className="text-sm">Agrega uno para empezar.</p>
          </div>
        ) : (
          sortedMedications.map((med) => {
            const nextDose = getNextDoseTime(med.lastTaken, med.frequency);
            const status = getStatus(nextDose);
            const finished = isTreatmentFinished(med);

            let statusColor = 'bg-white border-l-4 border-slate-300';
            let statusText = 'Pendiente';
            let textColor = 'text-slate-500';

            if (finished) {
              statusColor =
                'bg-slate-100 border-l-4 border-slate-400 opacity-75';
              textColor = 'text-slate-500';
            } else if (status === 'late') {
              statusColor = 'bg-red-50 border-l-4 border-red-500';
              statusText = '¡Atrasado!';
              textColor = 'text-red-600';
            } else if (status === 'soon') {
              statusColor = 'bg-amber-50 border-l-4 border-amber-400';
              statusText = 'Pronto';
              textColor = 'text-amber-600';
            } else {
              statusColor = 'bg-white border-l-4 border-emerald-400';
              statusText = 'A tiempo';
              textColor = 'text-emerald-600';
            }

            return (
              <div
                key={med.id}
                className={`${statusColor} p-4 rounded-xl shadow-sm transition-all hover:shadow-md flex flex-col gap-3 group relative`}
              >
                <div className="flex gap-3">
                  {/* Imagen del medicamento si existe */}
                  {med.image && (
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-200 border border-slate-100">
                      <img
                        src={med.image}
                        alt={med.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className={`font-bold text-lg ${
                            finished
                              ? 'text-slate-500 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {med.name}
                        </h3>
                        <p className="text-slate-500 text-xs mb-1">
                          {med.dosage} • Cada {med.frequency}h
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMedication(med.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress Info */}
                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    {med.durationType === 'days' && <Calendar size={12} />}
                    {med.durationType === 'pills' && <Hash size={12} />}
                    {med.durationType === 'indefinite' && (
                      <Infinity size={12} />
                    )}
                    <span>{getProgressText(med)}</span>
                  </div>
                  {med.durationType !== 'indefinite' && (
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-2">
                      <div
                        className={`h-full rounded-full ${
                          finished ? 'bg-slate-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${getProgressPercent(med)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${textColor}`}
                  >
                    {finished ? (
                      <span className="flex items-center gap-1 text-slate-500 font-bold">
                        <Check size={16} /> Completado
                      </span>
                    ) : (
                      <>
                        <Clock size={16} />
                        <span>
                          {status === 'late' ? 'Hora pasada:' : 'Próxima:'}{' '}
                          {formatTime(nextDose)}
                        </span>
                      </>
                    )}
                  </div>

                  {!finished && (
                    <button
                      onClick={() => takeMedication(med.id)}
                      className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                      aria-label="Marcar como tomado"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30"
      >
        <Plus size={28} />
      </button>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Nuevo Medicamento
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer overflow-hidden relative"
              >
                {newMed.image ? (
                  <img
                    src={newMed.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Camera size={32} className="mb-2 opacity-50" />
                    <span className="text-sm font-medium">
                      Toca para agregar foto
                    </span>
                  </>
                )}
                {newMed.image && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium text-sm flex gap-2 items-center">
                      <Camera size={16} /> Cambiar foto
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newMed.name}
                  onChange={(e) =>
                    setNewMed({ ...newMed, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    placeholder="500mg"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMed.dosage}
                    onChange={(e) =>
                      setNewMed({ ...newMed, dosage: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Frecuencia (Horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="8"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newMed.frequency}
                    onChange={(e) =>
                      setNewMed({ ...newMed, frequency: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Duración del tratamiento
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNewMed({ ...newMed, durationType: 'indefinite' })
                    }
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      newMed.durationType === 'indefinite'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-slate-500'
                    }`}
                  >
                    Siempre
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMed({ ...newMed, durationType: 'days' })
                    }
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      newMed.durationType === 'days'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-slate-500'
                    }`}
                  >
                    Por Días
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMed({ ...newMed, durationType: 'pills' })
                    }
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      newMed.durationType === 'pills'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-slate-500'
                    }`}
                  >
                    Por Tomas
                  </button>
                </div>

                {newMed.durationType !== 'indefinite' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs text-slate-500 mb-1">
                      {newMed.durationType === 'days'
                        ? '¿Cuántos días dura el tratamiento?'
                        : '¿Cuántas pastillas/tomas en total?'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder={
                        newMed.durationType === 'days'
                          ? 'Ej: 7 días'
                          : 'Ej: 20 pastillas'
                      }
                      value={newMed.durationTotal}
                      onChange={(e) =>
                        setNewMed({ ...newMed, durationTotal: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History size={24} className="text-blue-500" /> Historial
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <p className="text-center text-slate-400 mt-10">
                  Aún no hay registros.
                </p>
              ) : (
                history.map((record, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div>
                      <p className="font-bold text-slate-700">
                        {record.medName}
                      </p>
                      <p className="text-xs text-slate-500">{record.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">
                        {formatDate(record.timestamp)}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Tomada
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <ClipboardCopy size={18} />
          <span>¡Copiado al portapapeles!</span>
        </div>
      )}
    </div>
  );
};

export default App;
