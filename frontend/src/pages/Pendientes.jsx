import { useState, useEffect } from 'react';
import { tasks } from '../services/api';
import { CheckSquare, Calendar, Plus, Trash2, CheckCircle2, Clock, AlertCircle, ShieldAlert, Sparkles, Award, TrendingUp } from 'lucide-react';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Pendientes() {
  const [activeTab, setActiveTab] = useState('dia'); // 'dia' | 'semana'
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros Diarios
  const [fecha, setFecha] = useState(getTodayLocalDate());
  const [turno, setTurno] = useState('manana');

  // Formulario Pendiente Adicional
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFecha, setNewFecha] = useState(getTodayLocalDate());
  const [newTurno, setNewTurno] = useState('manana');

  // Rango Semanal para la vista Calendario
  const getWeekDates = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const dateDay = String(nextDay.getDate()).padStart(2, '0');
      week.push(`${year}-${month}-${dateDay}`);
    }
    return week;
  };

  const weekDates = getWeekDates(fecha);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dia') {
        const res = await tasks.getAll({ fecha, turno });
        setList(res.data);
      } else {
        const res = await tasks.getAll({ desde: startDate, hasta: endDate });
        setList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fecha, turno, activeTab]);

  const handleToggle = async (id) => {
    try {
      await tasks.toggle(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al actualizar el estado del pendiente');
    }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await tasks.create({
        fecha: newFecha,
        turno: newTurno,
        titulo: newTitle.trim()
      });
      setNewTitle('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar pendiente');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este pendiente adicional?')) return;
    try {
      await tasks.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const cajonTasks = list.filter(t => t.tipo === 'cajon');
  const customTasks = list.filter(t => t.tipo === 'adicional');

  const totalTasks = list.length;
  const completedTasks = list.filter(t => t.estatus === 'completada').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // CÁLCULO DE CUMPLIMIENTO SEMANAL
  const weekTotalTasks = list.length;
  const weekCompletedTasks = list.filter(t => t.estatus === 'completada').length;
  const weekCompliancePercent = weekTotalTasks > 0 ? Math.round((weekCompletedTasks / weekTotalTasks) * 100) : 0;

  const diasSemanaNombres = [
    { key: weekDates[0], name: 'LUNES' },
    { key: weekDates[1], name: 'MARTES' },
    { key: weekDates[2], name: 'MIÉRCOLES' },
    { key: weekDates[3], name: 'JUEVES' },
    { key: weekDates[4], name: 'VIERNES' },
    { key: weekDates[5], name: 'SÁBADO' },
    { key: weekDates[6], name: 'DOMINGO' },
  ];

  const getComplianceBadge = (pct) => {
    if (pct >= 90) return { label: '🟢 EXCELENTE CUMPLIMIENTO', style: 'bg-[#E8F3ED] text-[#1E5631] border-[#C3E2D1]' };
    if (pct >= 70) return { label: '🟡 CUMPLIMIENTO BUENO', style: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]' };
    return { label: '🔴 REQUIERE ATENCIÓN', style: 'bg-rose-100 text-rose-900 border-rose-200' };
  };

  const complianceBadge = getComplianceBadge(weekCompliancePercent);

  return (
    <div className="space-y-6">
      {/* HEADER DE SECCIÓN CON NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2C1A1D]">Pendientes & Roll de Limpieza</h2>
          <p className="text-sm font-semibold text-[#8C5A32]">Gestión de tareas operativas fijas y adicionales</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#EFE6D5] p-1 rounded-xl flex gap-1 border border-[#D9CBBA]">
            <button
              onClick={() => setActiveTab('dia')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dia' ? 'bg-[#2C1A1D] text-[#FFFDF9] shadow-sm' : 'text-[#2C1A1D]/70 hover:text-[#2C1A1D]'}`}
            >
              <CheckSquare size={16} /> Pendientes del Día
            </button>
            <button
              onClick={() => setActiveTab('semana')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'semana' ? 'bg-[#2C1A1D] text-[#FFFDF9] shadow-sm' : 'text-[#2C1A1D]/70 hover:text-[#2C1A1D]'}`}
            >
              <Calendar size={16} /> Calendario Semanal
            </button>
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={16} /> Nuevo Pendiente
          </button>
        </div>
      </div>

      {/* BANNER AVISO IMPORTANTE EVIDENCIA */}
      <div className="bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <ShieldAlert className="text-[#B45309] shrink-0 mt-0.5" size={22} />
        <div className="text-xs text-[#78350F]">
          <span className="font-extrabold uppercase tracking-wide text-[#B45309]">IMPORTANTE: </span>
          Todas las tareas a realizar de la semana se debe enviar evidencia del <b>ANTES y DESPUÉS</b> al grupo de reporte de limpieza Fátima. Gracias por hacer lo que te corresponde. ¡BUEN DÍA!
        </div>
      </div>

      {/* ---------------- PESTAÑA 1: PENDIENTES DEL DÍA & TURNO ---------------- */}
      {activeTab === 'dia' && (
        <>
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F4EDE2] pb-4">
              <div className="flex gap-4">
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field max-w-[160px]" />
                </div>
                <div>
                  <label className="label">Turno</label>
                  <select value={turno} onChange={(e) => setTurno(e.target.value)} className="input-field max-w-[140px]">
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                  </select>
                </div>
              </div>

              {/* BARRA DE PROGRESO DEL TURNO */}
              <div className="w-full sm:w-64 bg-[#F5EEE2] p-3 rounded-xl border border-[#E8DEC9]">
                <div className="flex justify-between text-xs font-bold text-[#2C1A1D] mb-1">
                  <span>Progreso del Turno</span>
                  <span>{completedTasks} / {totalTasks} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-[#E5D6C0] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#8C5A32] h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-center py-8 text-sm font-semibold text-[#8C5A32]">Cargando checklist...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMNA 1: TAREAS FIJAS DEL DÍA */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold font-serif text-[#2C1A1D] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-[#D97706]" /> Tareas Fijas del Día
                  </h3>

                  {cajonTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-[#FDFBF7] rounded-xl border border-[#EBE3D5]">No hay tareas fijas programadas para este turno.</p>
                  ) : (
                    cajonTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleToggle(t.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          t.estatus === 'completada' 
                            ? 'bg-[#E8F3ED] border-[#C3E2D1] text-[#1E5631]' 
                            : 'bg-white border-[#EBE3D5] hover:border-[#8C5A32] text-[#2C1A1D]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={t.estatus === 'completada'}
                            onChange={() => {}}
                            className="w-5 h-5 accent-[#1E5631] cursor-pointer rounded"
                          />
                          <span className={`text-sm font-semibold ${t.estatus === 'completada' ? 'line-through opacity-80' : ''}`}>
                            {t.titulo}
                          </span>
                        </div>
                        {t.estatus === 'completada' && (
                          <div className="text-[11px] text-[#1E5631] font-bold text-right shrink-0">
                            ✓ {t.completada_por_nombre || 'Registrado'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* COLUMNA 2: PENDIENTES ADICIONALES (AD-HOC) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold font-serif text-[#2C1A1D] uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-[#8C5A32]" /> Pendientes Adicionales
                  </h3>

                  {customTasks.length === 0 ? (
                    <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#EBE3D5] text-center">
                      <p className="text-xs text-slate-500">No hay pendientes adicionales registrados.</p>
                      <button onClick={() => setShowAddModal(true)} className="text-xs font-bold text-[#8C5A32] underline mt-1">
                        + Agregar un pendiente ad-hoc
                      </button>
                    </div>
                  ) : (
                    customTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          t.estatus === 'completada' 
                            ? 'bg-[#E8F3ED] border-[#C3E2D1] text-[#1E5631]' 
                            : 'bg-white border-[#EBE3D5] text-[#2C1A1D]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onClick={() => handleToggle(t.id)}>
                          <input
                            type="checkbox"
                            checked={t.estatus === 'completada'}
                            onChange={() => {}}
                            className="w-5 h-5 accent-[#1E5631] cursor-pointer rounded"
                          />
                          <span className={`text-sm font-semibold ${t.estatus === 'completada' ? 'line-through opacity-80' : ''}`}>
                            {t.titulo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.estatus === 'completada' && (
                            <span className="text-[11px] text-[#1E5631] font-bold">✓ {t.completada_por_nombre || 'Listo'}</span>
                          )}
                          <button onClick={() => handleDelete(t.id)} className="text-rose-600 hover:text-rose-800 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------------- PESTAÑA 2: CALENDARIO SEMANAL & CUMPLIMIENTO ---------------- */}
      {activeTab === 'semana' && (
        <div className="space-y-6">
          {/* PANEL DE INDICADORES DE CUMPLIMIENTO SEMANAL */}
          <div className="card bg-gradient-to-br from-white to-[#FDFBF7] border-[#EBE3D5]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 text-[#8C5A32] font-serif font-bold text-sm mb-1">
                  <Award size={20} className="text-[#D97706]" />
                  <span>CUMPLIMIENTO SEMANAL DE LIMPIEZA & TAREAS</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-[#2C1A1D]">{weekCompliancePercent}%</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${complianceBadge.style}`}>
                    {complianceBadge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {weekCompletedTasks} de {weekTotalTasks} tareas realizadas en la semana del <b>{startDate}</b> al <b>{endDate}</b>.
                </p>
              </div>

              {/* DESGLOSE POR DÍA DE LA SEMANA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 w-full lg:w-auto">
                {diasSemanaNombres.map((d) => {
                  const dayTasks = list.filter(t => t.fecha === d.key);
                  const dayTotal = dayTasks.length;
                  const dayCompleted = dayTasks.filter(t => t.estatus === 'completada').length;
                  const dayPct = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

                  return (
                    <div key={`comp-${d.key}`} className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EBE3D5] text-center">
                      <div className="text-[10px] font-extrabold text-[#2C1A1D] uppercase">{d.name.slice(0, 3)}</div>
                      <div className="text-sm font-black text-[#8C5A32] mt-0.5">{dayPct}%</div>
                      <div className="text-[9px] text-slate-500">{dayCompleted}/{dayTotal}</div>
                      <div className="w-full bg-[#E5D6C0] h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-[#1E5631] h-full" style={{ width: `${dayPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card space-y-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F4EDE2] pb-4">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#2C1A1D]">Roll de Limpieza Semanal</h3>
                <p className="text-xs text-[#8C5A32]">Semana del {startDate} al {endDate}</p>
              </div>
              <div>
                <label className="label">Seleccionar fecha para ver su semana</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field max-w-[170px]" />
              </div>
            </div>

            {loading ? (
              <p className="text-center py-8 text-sm font-semibold text-[#8C5A32]">Cargando matriz semanal...</p>
            ) : (
              <div className="min-w-[900px]">
                {/* TABLA DE MATRIZ SEMANAL */}
                <table className="w-full border-collapse border border-[#E2D5C0] rounded-xl text-xs">
                  <thead>
                    <tr className="bg-[#2C1A1D] text-[#FFFDF9]">
                      <th className="p-3 border border-[#3D2428] w-28 text-center font-serif">TURNO</th>
                      {diasSemanaNombres.map((d) => (
                        <th key={d.key} className="p-3 border border-[#3D2428] font-bold text-center">
                          <div>{d.name}</div>
                          <div className="text-[10px] text-[#FDE68A] font-mono">{d.key}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* RENGLÓN 1: MATUTINO (MAÑANA) */}
                    <tr>
                      <td className="p-3 font-extrabold bg-[#F5EEE2] text-[#2C1A1D] border border-[#E2D5C0] text-center uppercase font-serif">
                        MATUTINO (Mañana)
                      </td>
                      {diasSemanaNombres.map((d) => {
                        const dayTasks = list.filter(t => t.fecha === d.key && t.turno === 'manana');
                        return (
                          <td key={`manana-${d.key}`} className="p-2 border border-[#E2D5C0] bg-white align-top">
                            <div className="space-y-1.5">
                              {dayTasks.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic block text-center">- Sin tareas -</span>
                              ) : (
                                dayTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={() => handleToggle(t.id)}
                                    className={`p-1.5 rounded-lg border text-[11px] cursor-pointer flex items-start gap-1.5 transition-all ${
                                      t.estatus === 'completada' 
                                        ? 'bg-[#E8F3ED] border-[#C3E2D1] text-[#1E5631]' 
                                        : 'bg-[#FAF7F2] border-[#EBE3D5] text-[#2C1A1D] hover:border-[#8C5A32]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={t.estatus === 'completada'}
                                      onChange={() => {}}
                                      className="w-3.5 h-3.5 mt-0.5 accent-[#1E5631]"
                                    />
                                    <span className={t.estatus === 'completada' ? 'line-through opacity-70' : 'font-medium'}>
                                      {t.titulo}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* RENGLÓN 2: VESPERTINO (TARDE) */}
                    <tr>
                      <td className="p-3 font-extrabold bg-[#F5EEE2] text-[#2C1A1D] border border-[#E2D5C0] text-center uppercase font-serif">
                        VESPERTINO (Tarde)
                      </td>
                      {diasSemanaNombres.map((d) => {
                        const dayTasks = list.filter(t => t.fecha === d.key && t.turno === 'tarde');
                        return (
                          <td key={`tarde-${d.key}`} className="p-2 border border-[#E2D5C0] bg-white align-top">
                            <div className="space-y-1.5">
                              {dayTasks.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic block text-center">- Sin tareas -</span>
                              ) : (
                                dayTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={() => handleToggle(t.id)}
                                    className={`p-1.5 rounded-lg border text-[11px] cursor-pointer flex items-start gap-1.5 transition-all ${
                                      t.estatus === 'completada' 
                                        ? 'bg-[#E8F3ED] border-[#C3E2D1] text-[#1E5631]' 
                                        : 'bg-[#FAF7F2] border-[#EBE3D5] text-[#2C1A1D] hover:border-[#8C5A32]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={t.estatus === 'completada'}
                                      onChange={() => {}}
                                      className="w-3.5 h-3.5 mt-0.5 accent-[#1E5631]"
                                    />
                                    <span className={t.estatus === 'completada' ? 'line-through opacity-70' : 'font-medium'}>
                                      {t.titulo}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CREAR PENDIENTE ADICIONAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1F120A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold font-serif text-[#2C1A1D] mb-4">Agregar Nuevo Pendiente</h3>
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div>
                <label className="label">Título o Descripción de la Tarea</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  placeholder="ej: Checar nivel de gas o comprar servilletas"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha</label>
                  <input
                    type="date"
                    value={newFecha}
                    onChange={(e) => setNewFecha(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Turno</label>
                  <select
                    value={newTurno}
                    onChange={(e) => setNewTurno(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Guardar Pendiente</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}