import { useState, useEffect } from 'react';
import { cuts, expenses, secondaryCuts } from '../services/api';
import { Wallet, Plus, Eye, UserCheck, ShieldCheck, Printer, Calendar, FileText, AlertCircle, DollarSign, BarChart2, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Cortes() {
  const formatCurrency = (val) => `$${Number(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const [activeTab, setActiveTab] = useState('caja'); // 'caja' | 'secundario' | 'auditoria'

  // --- CORTE PRIMARIO ESTADOS ---
  const [cutsList, setCutsList] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCut, setSelectedCut] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fecha: getTodayLocalDate(),
    turno: 'manana',
    efectivo_contado: '',
    tarjeta_terminal: '',
    observaciones: ''
  });

  const [showExpense, setShowExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    fecha: getTodayLocalDate(),
    turno: 'manana',
    concepto: '',
    monto: '',
    observacion: ''
  });

  // --- CORTE SECUNDARIO ESTADOS ---
  const [secondaryList, setSecondaryList] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedSecCut, setSelectedSecCut] = useState(null);
  const [showSecForm, setShowSecForm] = useState(false);
  const [secPreview, setSecPreview] = useState(null);

  const [newRecipientName, setNewRecipientName] = useState('');
  const [showNewRecipientModal, setShowNewRecipientModal] = useState(false);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('todos');

  const [secForm, setSecForm] = useState({
    destinatario_nombre: '',
    modalidad: 'dia_especifico', // 'dia_especifico' | 'rango_fechas'
    fecha: getTodayLocalDate(),
    turno: 'completo', // 'completo' | 'manana' | 'tarde'
    fecha_inicio: getTodayLocalDate(),
    turno_inicio: 'manana', // 'manana' | 'tarde'
    fecha_fin: getTodayLocalDate(),
    turno_fin: 'completo', // 'completo' | 'manana' | 'tarde'
    monto_entregado: '',
    observaciones: ''
  });

  // Cargas iniciales
  useEffect(() => {
    cuts.getAll({ fecha: form.fecha }).then(({ data }) => {
      setCutsList(data);
      setLoading(false);
    });
  }, [form.fecha]);

  useEffect(() => {
    if (activeTab === 'secundario') {
      loadSecondaryData();
    } else if (activeTab === 'auditoria') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadSecondaryData = async () => {
    try {
      const [secRes, recRes] = await Promise.all([
        secondaryCuts.getAll(),
        secondaryCuts.getRecipients()
      ]);
      setSecondaryList(secRes.data);
      setRecipients(recRes.data);
    } catch (err) {
      console.error('Error al cargar cortes secundarios:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data } = await secondaryCuts.getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
    }
  };

  const loadPreview = async () => {
    try {
      const { data } = await cuts.preview({ fecha: form.fecha, turno: form.turno });
      if (data) {
        setPreview({
          ...data,
          total_tickets: Number(data.total_tickets || 0),
          efectivo_bruto: Number(data.efectivo_bruto || 0),
          tarjeta_bruto: Number(data.tarjeta_bruto || 0),
          total_gastos: Number(data.total_gastos || 0),
          total_consumo_propio: Number(data.total_consumo_propio || 0),
          efectivo_final: Number(data.efectivo_final || 0),
          total_final: Number(data.total_final || 0)
        });
      }
    } catch (err) {
      console.error('Error al cargar vista previa del corte:', err);
    }
  };

  useEffect(() => {
    if (showForm) loadPreview();
  }, [showForm, form.turno, form.fecha]);

  const handleCut = async (e) => {
    e.preventDefault();
    try {
      await cuts.create(form);
      setShowForm(false);
      setPreview(null);
      const { data } = await cuts.getAll({ fecha: form.fecha });
      setCutsList(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cerrar corte');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenses.create(expenseForm);
      setShowExpense(false);
      setExpenseForm({ ...expenseForm, concepto: '', monto: '', observacion: '' });
      if (showForm) loadPreview();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar gasto');
    }
  };

  const viewCut = async (id) => {
    const { data } = await cuts.getOne(id);
    setSelectedCut(data);
    setSelectedSecCut(null);
  };

  // --- CORTE SECUNDARIO LOGICA ---
  const loadSecPreview = async () => {
    try {
      const { data } = await secondaryCuts.preview({
        modalidad: secForm.modalidad,
        fecha: secForm.fecha,
        turno: secForm.turno,
        fecha_inicio: secForm.fecha_inicio,
        turno_inicio: secForm.turno_inicio,
        fecha_fin: secForm.fecha_fin,
        turno_fin: secForm.turno_fin
      });
      setSecPreview(data);
      setSecForm(prev => ({ ...prev, monto_entregado: data.monto_sugerido }));
    } catch (err) {
      console.error('Error al calcular vista previa:', err);
    }
  };

  useEffect(() => {
    if (showSecForm) loadSecPreview();
  }, [
    showSecForm,
    secForm.modalidad,
    secForm.fecha,
    secForm.turno,
    secForm.fecha_inicio,
    secForm.turno_inicio,
    secForm.fecha_fin,
    secForm.turno_fin
  ]);

  const handleCreateRecipient = async (e) => {
    e.preventDefault();
    if (!newRecipientName.trim()) return;
    try {
      const { data } = await secondaryCuts.createRecipient({ nombre: newRecipientName });
      setRecipients([...recipients, data]);
      setSecForm({ ...secForm, destinatario_nombre: data.nombre });
      setNewRecipientName('');
      setShowNewRecipientModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear destinatario');
    }
  };

  const handleSecondaryCutSubmit = async (e) => {
    e.preventDefault();
    if (secPreview && Number(secForm.monto_entregado) > secPreview.efectivo_restante_disponible) {
      const confirmOverdraw = window.confirm(
        `Atención: El monto a entregar ($${Number(secForm.monto_entregado).toFixed(2)}) supera el efectivo disponible restante ($${secPreview.efectivo_restante_disponible.toFixed(2)}).\n\n¿Deseas continuar y registrar esta entrega de todos modos?`
      );
      if (!confirmOverdraw) return;
    }

    try {
      await secondaryCuts.create(secForm);
      setShowSecForm(false);
      setSecPreview(null);
      loadSecondaryData();
      alert('¡Entrega de efectivo registrada con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar entrega');
    }
  };

  const viewSecCut = async (id) => {
    const { data } = await secondaryCuts.getOne(id);
    setSelectedSecCut(data);
    setSelectedCut(null);
  };

  const estatusBadge = { abierto: 'badge-warning', con_diferencia: 'badge-danger', cerrado: 'badge-success' };
  const estatusLabel = { abierto: 'Abierto', con_diferencia: 'Con diferencia', cerrado: 'Cerrado' };

  return (
    <div>
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Cortes y Entrega de Fondos</h2>
          <p className="text-gray-500 text-sm">Gestión de cierres por turno, retiros de efectivo y auditoría</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'caja' && (
            <>
              <button onClick={() => setShowExpense(!showExpense)} className="btn-secondary flex items-center gap-2">
                <Plus size={18} /> Gasto
              </button>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                <Wallet size={18} /> Nuevo Corte Diario
              </button>
            </>
          )}
          {activeTab === 'secundario' && (
            <button onClick={() => setShowSecForm(!showSecForm)} className="btn-primary flex items-center gap-2">
              <UserCheck size={18} /> Registrar Entrega de Fondo
            </button>
          )}
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('caja')}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'caja'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet size={16} /> Cortes de Caja (Diario / Turno)
        </button>

        <button
          onClick={() => setActiveTab('secundario')}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'secundario'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign size={16} /> Cortes Secundarios (Entrega de Efectivo)
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'auditoria'
              ? 'border-[#8C5A32] text-[#3D2314] font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck size={16} /> Bitácora de Auditoría
        </button>
      </div>

      {/* ---------------- PESTAÑA 1: CORTE DE CAJA ---------------- */}
      {activeTab === 'caja' && (
        <>
          {showExpense && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Registrar Gasto de Sucursal</h3>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={expenseForm.fecha} onChange={(e) => setExpenseForm({ ...expenseForm, fecha: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Turno</label>
                  <select value={expenseForm.turno} onChange={(e) => setExpenseForm({ ...expenseForm, turno: e.target.value })} className="input-field">
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                  </select>
                </div>
                <div>
                  <label className="label">Concepto</label>
                  <input type="text" value={expenseForm.concepto} onChange={(e) => setExpenseForm({ ...expenseForm, concepto: e.target.value })} className="input-field" placeholder="Ej. Compra de leche" required />
                </div>
                <div>
                  <label className="label">Monto</label>
                  <input type="number" step="0.01" min="0.01" value={expenseForm.monto} onChange={(e) => setExpenseForm({ ...expenseForm, monto: e.target.value })} className="input-field" required />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Observación</label>
                  <input type="text" value={expenseForm.observacion} onChange={(e) => setExpenseForm({ ...expenseForm, observacion: e.target.value })} className="input-field" placeholder="Opcional" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary">Guardar Gasto</button>
                  <button type="button" onClick={() => setShowExpense(false)} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Cerrar Corte de Caja</h3>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Turno</label>
                  <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className="input-field">
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                  </select>
                </div>
              </div>

              {preview && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">Tickets:</span> <span className="font-semibold">{preview.total_tickets}</span></div>
                    <div><span className="text-gray-500">Efectivo bruto:</span> <span className="font-semibold text-green-600">{formatCurrency(preview.efectivo_bruto)}</span></div>
                    <div><span className="text-gray-500">Tarjeta:</span> <span className="font-semibold text-blue-600">{formatCurrency(preview.tarjeta_bruto)}</span></div>
                    <div><span className="text-gray-500">Gastos:</span> <span className="font-semibold text-yellow-600">-{formatCurrency(preview.total_gastos)}</span></div>
                    <div><span className="text-gray-500">Consumo propio:</span> <span className="font-semibold text-purple-700">{formatCurrency(preview.total_consumo_propio)}</span></div>
                    <div><span className="text-gray-500">Efectivo final:</span> <span className="font-semibold text-primary-600">{formatCurrency(preview.efectivo_final)}</span></div>
                    <div><span className="text-gray-500">Total final:</span> <span className="font-semibold">{formatCurrency(preview.total_final)}</span></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCut} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Efectivo contado</label>
                  <input type="number" step="0.01" min="0" value={form.efectivo_contado} onChange={(e) => setForm({ ...form, efectivo_contado: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Tarjeta según terminal</label>
                  <input type="number" step="0.01" min="0" value={form.tarjeta_terminal} onChange={(e) => setForm({ ...form, tarjeta_terminal: e.target.value })} className="input-field" required />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Observaciones</label>
                  <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="input-field" placeholder="Motivo de diferencia si aplica" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary">Cerrar Corte</button>
                  <button type="button" onClick={() => { setShowForm(false); setPreview(null); }} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div>
              <label className="label">Ver por fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input-field" />
            </div>
          </div>

          {selectedCut && (
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Detalle del Corte Primario #{selectedCut.id}</h3>
                <button onClick={() => setSelectedCut(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div><span className="text-gray-500">Fecha:</span> <span className="font-semibold">{selectedCut.fecha}</span></div>
                <div><span className="text-gray-500">Turno:</span> <span className="font-semibold capitalize">{selectedCut.turno === 'manana' ? 'Mañana' : 'Tarde'}</span></div>
                <div><span className="text-gray-500">Responsable:</span> <span className="font-semibold">{selectedCut.responsable_nombre}</span></div>
                <div><span className="text-gray-500">Estatus:</span> <span className={`badge ${estatusBadge[selectedCut.estatus]}`}>{estatusLabel[selectedCut.estatus]}</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div><span className="text-gray-500">Efectivo bruto:</span> <span className="font-semibold">{formatCurrency(selectedCut.total_efectivo_bruto)}</span></div>
                <div><span className="text-gray-500">Tarjeta:</span> <span className="font-semibold">{formatCurrency(selectedCut.total_tarjeta)}</span></div>
                <div><span className="text-gray-500">Gastos:</span> <span className="font-semibold">{formatCurrency(selectedCut.total_gastos)}</span></div>
                <div><span className="text-gray-500">Consumo propio:</span> <span className="font-semibold text-purple-700">{formatCurrency(selectedCut.total_consumo_propio)}</span></div>
                <div><span className="text-gray-500">Efectivo final:</span> <span className="font-semibold">{formatCurrency(selectedCut.efectivo_final)}</span></div>
                <div><span className="text-gray-500">Efectivo contado:</span> <span className="font-semibold">{formatCurrency(selectedCut.efectivo_contado)}</span></div>
                <div><span className="text-gray-500">Diferencia:</span> <span className={`font-semibold ${Math.abs(selectedCut.diferencia_efectivo || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(selectedCut.diferencia_efectivo)}</span></div>
              </div>
              {selectedCut.observaciones && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-sm">
                  <span className="font-semibold text-yellow-800">Observaciones:</span>
                  <p className="text-yellow-900 mt-1">{selectedCut.observaciones}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
                  <Printer size={16} /> Imprimir Ticket de Corte
                </button>
              </div>

              {/* Ticket Primario */}
              <div className="print-ticket-area screen-only-hidden">
                <div className="center bold" style={{ fontSize: '13px' }}>TUTTI BOCADO</div>
                <div className="center">Sucursal Fátima</div>
                <div className="divider"></div>
                <div className="bold text-center">TICKET DE CIERRE DE CAJA</div>
                <div className="divider"></div>
                <div><b>Corte ID:</b> #{selectedCut.id}</div>
                <div><b>Fecha:</b> {selectedCut.fecha}</div>
                <div><b>Turno:</b> {selectedCut.turno === 'manana' ? 'Mañana' : 'Tarde'}</div>
                <div><b>Responsable:</b> {selectedCut.responsable_nombre}</div>
                <div className="divider"></div>
                <table>
                  <tbody>
                    <tr>
                      <td>Efectivo Bruto:</td>
                      <td className="right">${Number(selectedCut.total_efectivo_bruto || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Tarjeta Ventas:</td>
                      <td className="right">${Number(selectedCut.total_tarjeta || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Gastos Turno:</td>
                      <td className="right">-${Number(selectedCut.total_gastos || 0).toFixed(2)}</td>
                    </tr>
                    {Number(selectedCut.total_consumo_propio || 0) > 0 && (
                      <tr>
                        <td>Consumo Propio (Personal):</td>
                        <td className="right">${Number(selectedCut.total_consumo_propio).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bold">
                      <td>Efectivo Esperado:</td>
                      <td className="right">${Number(selectedCut.efectivo_final || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="bold">
                      <td>Efectivo Real Contado:</td>
                      <td className="right">${Number(selectedCut.efectivo_contado || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="bold" style={{ borderTop: '1px dashed #000' }}>
                      <td>DIFERENCIA:</td>
                      <td className="right">${Number(selectedCut.diferencia_efectivo || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="divider"></div>
                <br />
                <div className="center">_________________________</div>
                <div className="center" style={{ fontSize: '9px' }}>Firma de Conformidad</div>
              </div>
            </div>
          )}

          <div className="card overflow-x-auto">
            {loading ? <p className="text-center py-4">Cargando...</p> : cutsList.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No hay cortes registrados en esta fecha</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Turno</th>
                    <th className="px-4 py-3">Efectivo</th>
                    <th className="px-4 py-3">Tarjeta</th>
                    <th className="px-4 py-3">Gastos</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estatus</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cutsList.map((c, index) => (
                    <tr key={`cut-${c.id}-${index}`} className="border-t border-gray-100">
                      <td className="table-cell">{c.fecha}</td>
                      <td className="table-cell capitalize">{c.turno === 'manana' ? 'Mañana' : 'Tarde'}</td>
                      <td className="table-cell">{formatCurrency(c.total_efectivo_bruto)}</td>
                      <td className="table-cell">{formatCurrency(c.total_tarjeta)}</td>
                      <td className="table-cell text-yellow-600">{formatCurrency(c.total_gastos)}</td>
                      <td className="table-cell font-semibold">{formatCurrency(c.total_final)}</td>
                      <td className="table-cell"><span className={`badge ${estatusBadge[c.estatus]}`}>{estatusLabel[c.estatus]}</span></td>
                      <td className="table-cell">
                        <button onClick={() => viewCut(c.id)} className="text-primary-600 hover:text-primary-800"><Eye size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ---------------- PESTAÑA 2: CORTE SECUNDARIO / ENTREGA DE EFECTIVO ---------------- */}
      {activeTab === 'secundario' && (
        <>
          {showSecForm && (
            <div className="card mb-6 border-l-4 border-l-primary-600 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" size={20} /> Registrar Entrega de Fondo (Efectivo Físico)
                  </h3>
                  <p className="text-xs text-gray-500">Calcula automáticamente el saldo disponible deduciendo retiros previos</p>
                </div>
                <button onClick={() => setShowSecForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={handleSecondaryCutSubmit} className="space-y-4">
                {/* DESTINATARIO Y MODALIDAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">A quién se entrega el dinero (Destinatario)</label>
                    <div className="flex gap-2">
                      <select
                        value={secForm.destinatario_nombre}
                        onChange={(e) => setSecForm({ ...secForm, destinatario_nombre: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">-- Seleccionar Destinatario --</option>
                        {recipients.map((r, index) => (
                          <option key={`rec-${r.id}-${index}`} value={r.nombre}>{r.nombre}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewRecipientModal(true)}
                        className="btn-secondary whitespace-nowrap"
                      >
                        + Nuevo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Modalidad de Selección de Periodo</label>
                    <select
                      value={secForm.modalidad}
                      onChange={(e) => setSecForm({ ...secForm, modalidad: e.target.value })}
                      className="input-field"
                    >
                      <option value="dia_especifico">Día Único (Turno o Completo)</option>
                      <option value="rango_fechas">Rango de Varios Días (Con selección fina de inicio/fin)</option>
                    </select>
                  </div>
                </div>

                {/* FILTROS SEGÚN MODALIDAD */}
                {secForm.modalidad === 'dia_especifico' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="label">Fecha</label>
                      <input
                        type="date"
                        value={secForm.fecha}
                        onChange={(e) => setSecForm({ ...secForm, fecha: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Selección de Turno</label>
                      <select
                        value={secForm.turno}
                        onChange={(e) => setSecForm({ ...secForm, turno: e.target.value })}
                        className="input-field"
                      >
                        <option value="completo">Día Completo (Mañana y Tarde)</option>
                        <option value="manana">Únicamente Turno Mañana</option>
                        <option value="tarde">Únicamente Turno Tarde</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="label">Fecha Inicial</label>
                      <input
                        type="date"
                        value={secForm.fecha_inicio}
                        onChange={(e) => setSecForm({ ...secForm, fecha_inicio: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Desde Turno (Día Inicial)</label>
                      <select
                        value={secForm.turno_inicio}
                        onChange={(e) => setSecForm({ ...secForm, turno_inicio: e.target.value })}
                        className="input-field"
                      >
                        <option value="manana">Desde Mañana (Día completo)</option>
                        <option value="tarde">Desde Tarde</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Fecha Final</label>
                      <input
                        type="date"
                        value={secForm.fecha_fin}
                        onChange={(e) => setSecForm({ ...secForm, fecha_fin: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Hasta Turno (Día Final)</label>
                      <select
                        value={secForm.turno_fin}
                        onChange={(e) => setSecForm({ ...secForm, turno_fin: e.target.value })}
                        className="input-field"
                      >
                        <option value="completo">Hasta el final del Día (Completo)</option>
                        <option value="manana">Hasta Turno Mañana únicamente</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* RESUMEN FINANCIERO DE EFECTIVO DISPONIBLE */}
                {secPreview && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 text-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm border border-emerald-100">
                      <span className="text-gray-500 text-xs block font-medium">💵 Efectivo Generado en Caja:</span>
                      <span className="font-bold text-lg text-gray-800">${Number(secPreview.total_efectivo_generado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-gray-400 block mt-1">{secPreview.total_cortes_primarios || 0} turno(s) incluido(s)</span>
                    </div>

                    <div className="bg-white p-3 rounded shadow-sm border border-emerald-100">
                      <span className="text-gray-500 text-xs block font-medium">🔴 Retiros / Entregas Previas:</span>
                      <span className="font-bold text-lg text-red-600">-${Number(secPreview.total_ya_entregado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-gray-400 block mt-1">Ya retirados en entregas anteriores</span>
                    </div>

                    <div className="bg-white p-3 rounded shadow-sm border-2 border-emerald-500">
                      <span className="text-emerald-700 text-xs block font-bold">🟩 Saldo Restante Disponible:</span>
                      <span className="font-extrabold text-xl text-emerald-600">${Number(secPreview.efectivo_restante_disponible || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-emerald-600 block mt-1 font-medium">Máximo disponible para entregar</span>
                    </div>
                  </div>
                )}

                {/* ADVERTENCIA DE SOBREGIRO */}
                {secPreview && Number(secForm.monto_entregado) > Number(secPreview.efectivo_restante_disponible || 0) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span><b>Atención:</b> El monto ingresado (${Number(secForm.monto_entregado).toFixed(2)}) es superior al saldo en efectivo restante disponible (${Number(secPreview.efectivo_restante_disponible || 0).toFixed(2)}).</span>
                  </div>
                )}

                {/* CAMPOS DE MONTO Y NOTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Monto de Efectivo a Entregar ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={secForm.monto_entregado}
                      onChange={(e) => setSecForm({ ...secForm, monto_entregado: e.target.value })}
                      className="input-field text-xl font-extrabold text-green-700"
                      placeholder="Monto entregado"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Observaciones / Motivo de Entrega</label>
                    <input
                      type="text"
                      value={secForm.observaciones}
                      onChange={(e) => setSecForm({ ...secForm, observaciones: e.target.value })}
                      className="input-field"
                      placeholder="Ej. Retiro parcial de efectivo / Depósito semanal a socio"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary">Guardar Entrega de Fondo</button>
                  <button type="button" onClick={() => setShowSecForm(false)} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* DETALLE DEL CORTE SECUNDARIO SELECCIONADO */}
          {selectedSecCut && (
            <div className="card mb-6 border-l-4 border-l-green-600 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Recibo de Entrega de Fondo en Efectivo #{selectedSecCut.id}</h3>
                <button onClick={() => setSelectedSecCut(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div><span className="text-gray-500">Destinatario:</span> <span className="font-bold text-gray-800">{selectedSecCut.destinatario_nombre}</span></div>
                <div><span className="text-gray-500">Monto Entregado:</span> <span className="font-bold text-green-700">{formatCurrency(selectedSecCut?.monto_entregado)}</span></div>
                <div><span className="text-gray-500">Forma de Fondo:</span> <span className="font-semibold uppercase text-emerald-700">EFECTIVO FÍSICO</span></div>
                <div><span className="text-gray-500">Entregado por:</span> <span className="font-semibold">{selectedSecCut.registrado_por_nombre}</span></div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
                <p><b>Periodo recortado:</b> {selectedSecCut.modalidad === 'rango_fechas' ? `Del ${selectedSecCut.fecha_inicio} (${selectedSecCut.turno_inicio === 'tarde' ? 'Turno Tarde' : 'Mañana'}) al ${selectedSecCut.fecha_fin} (${selectedSecCut.turno_fin === 'manana' ? 'Turno Mañana' : 'Día Completo'})` : `Día ${selectedSecCut.fecha_corte} (Turno: ${selectedSecCut.turno === 'completo' ? 'Completo' : selectedSecCut.turno})`}</p>
                {selectedSecCut.observaciones && <p className="mt-1"><b>Observaciones:</b> {selectedSecCut.observaciones}</p>}
                <p className="text-xs text-gray-400 mt-2">Registrado el: {new Date(selectedSecCut.created_at).toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
                  <Printer size={16} /> Imprimir Comprobante de Entrega
                </button>
              </div>

              {/* TICKET DE IMPRESIÓN SECUNDARIO */}
              <div className="print-ticket-area screen-only-hidden">
                <div className="center bold" style={{ fontSize: '13px' }}>TUTTI BOCADO</div>
                <div className="center">Sucursal Fátima</div>
                <div className="divider"></div>
                <div className="bold text-center">RECIBO DE ENTREGA DE EFECTIVO</div>
                <div className="bold text-center">(CORTE SECUNDARIO #{selectedSecCut.id})</div>
                <div className="divider"></div>

                <div><b>Destinatario:</b> {selectedSecCut.destinatario_nombre}</div>
                <div><b>Monto Entregado:</b> ${Number(selectedSecCut.monto_entregado).toFixed(2)}</div>
                <div><b>Concepto:</b> EFECTIVO FÍSICO DE CAJA</div>
                <div><b>Periodo:</b> {selectedSecCut.modalidad === 'rango_fechas' ? `${selectedSecCut.fecha_inicio} al ${selectedSecCut.fecha_fin}` : `${selectedSecCut.fecha_corte} (${selectedSecCut.turno})`}</div>
                <div><b>Registrado Por:</b> {selectedSecCut.registrado_por_nombre}</div>

                {selectedSecCut.observaciones && (
                  <>
                    <div className="divider"></div>
                    <div><b>Obs:</b> {selectedSecCut.observaciones}</div>
                  </>
                )}

                <div className="divider"></div>
                <br />
                <br />
                <div className="center">_________________________</div>
                <div className="center" style={{ fontSize: '10px' }}>Firma Recibido</div>
                <div className="center" style={{ fontSize: '9px' }}>{selectedSecCut.destinatario_nombre}</div>
                <br />
                <div className="center">_________________________</div>
                <div className="center" style={{ fontSize: '10px' }}>Firma Entrega</div>
                <div className="center" style={{ fontSize: '9px' }}>{selectedSecCut.registrado_por_nombre}</div>
                <br />
                <div className="center" style={{ fontSize: '8px' }}>Fecha impresión: {new Date().toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* GRÁFICO VISUAL DE ENTREGAS POR DESTINATARIO */}
          {secondaryList.length > 0 && (
            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart2 className="text-primary-600" size={20} /> Distribución de Efectivo Entregado por Destinatario
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(
                      secondaryList.reduce((acc, sec) => {
                        acc[sec.destinatario_nombre] = (acc[sec.destinatario_nombre] || 0) + Number(sec.monto_entregado);
                        return acc;
                      }, {})
                    ).map(([destinatario, total]) => ({ destinatario, Total: total }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="destinatario" />
                    <YAxis />
                    <Tooltip formatter={(val) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <Bar dataKey="Total" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TABLA DE HISTORIAL DE CORTES SECUNDARIOS */}
          <div className="card overflow-x-auto">
            <h3 className="font-semibold text-gray-700 mb-4">Historial de Entregas de Fondos en Efectivo</h3>
            {secondaryList.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No hay entregas secundarias registradas</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Destinatario</th>
                    <th className="px-4 py-3">Periodo / Turnos</th>
                    <th className="px-4 py-3">Monto Entregado</th>
                    <th className="px-4 py-3">Registró</th>
                    <th className="px-4 py-3">Fecha Registro</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {secondaryList.map((s, index) => (
                    <tr key={`sec-${s.id}-${index}`} className="border-t border-gray-100">
                      <td className="table-cell font-bold">#{s.id}</td>
                      <td className="table-cell font-semibold text-gray-800">{s.destinatario_nombre}</td>
                      <td className="table-cell text-sm">
                        {s.modalidad === 'rango_fechas' ? (
                          <span className="badge badge-warning">{s.fecha_inicio} al {s.fecha_fin}</span>
                        ) : (
                          <span>{s.fecha_corte} ({s.turno === 'completo' ? 'Día Completo' : s.turno})</span>
                        )}
                      </td>
                      <td className="table-cell font-extrabold text-green-700">{formatCurrency(s.monto_entregado)}</td>
                      <td className="table-cell">{s.registrado_por_nombre}</td>
                      <td className="table-cell text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <button onClick={() => viewSecCut(s.id)} className="text-primary-600 hover:text-primary-800">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ---------------- PESTAÑA 3: BITÁCORA DE AUDITORÍA ---------------- */}
      {activeTab === 'auditoria' && (() => {
        const filteredLogs = auditLogs.filter(log => {
          const matchesSearch = !auditSearch.trim() || 
            (log.usuario_nombre || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
            (log.detalles || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
            (log.accion || '').toLowerCase().includes(auditSearch.toLowerCase());

          const matchesAction = auditActionFilter === 'todos' ||
            (auditActionFilter === 'entrega' && log.accion === 'CREAR_CORTE_SECUNDARIO') ||
            (auditActionFilter === 'cierre' && log.accion === 'CORTE_CAJA');

          return matchesSearch && matchesAction;
        });

        const totalAuditEntries = auditLogs.length;
        const totalEntregasAuditadas = auditLogs.filter(l => l.accion === 'CREAR_CORTE_SECUNDARIO').length;
        const lastAuditTime = auditLogs.length > 0 ? new Date(auditLogs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

        return (
          <div className="space-y-6">
            {/* MINITARJETAS DE MÉTRICAS DE AUDITORÍA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 bg-white border-[#EBE3D5] flex items-center gap-3">
                <div className="p-3 bg-[#F5EEE2] text-[#8C5A32] rounded-xl border border-[#E2D5C0]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8C5A32]">Total Movimientos</p>
                  <p className="text-xl font-extrabold text-[#2C1A1D]">{totalAuditEntries}</p>
                </div>
              </div>

              <div className="card p-4 bg-white border-[#EBE3D5] flex items-center gap-3">
                <div className="p-3 bg-[#FEF3C7] text-[#B45309] rounded-xl border border-[#FDE68A]">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B45309]">Entregas Registradas</p>
                  <p className="text-xl font-extrabold text-[#2C1A1D]">{totalEntregasAuditadas}</p>
                </div>
              </div>

              <div className="card p-4 bg-white border-[#EBE3D5] flex items-center gap-3">
                <div className="p-3 bg-[#E8F3ED] text-[#1E5631] rounded-xl border border-[#C3E2D1]">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1E5631]">Última Actividad</p>
                  <p className="text-xl font-extrabold text-[#2C1A1D]">{lastAuditTime}</p>
                </div>
              </div>
            </div>

            {/* TABLA CON BUSCADOR Y FILTROS */}
            <div className="card overflow-x-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-[#F4EDE2]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#8C5A32]" />
                  <h3 className="font-bold font-serif text-[#2C1A1D] text-base">Bitácora Oficial de Auditoría</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="🔍 Buscar en auditoría..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="input-field max-w-[220px]"
                  />
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="input-field max-w-[180px]"
                  >
                    <option value="todos">Todas las Acciones</option>
                    <option value="entrega">💸 Entregas de Efectivo</option>
                    <option value="cierre">🔒 Cierres de Caja</option>
                  </select>
                  <button onClick={loadAuditLogs} className="btn-secondary text-xs py-2">
                    Refrescar Bitácora
                  </button>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <p className="text-center py-8 text-sm font-semibold text-slate-500">No hay movimientos que coincidan con la búsqueda.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">Usuario Auditor</th>
                      <th className="px-4 py-3">Acción Registrada</th>
                      <th className="px-4 py-3">Detalles Completos del Movimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={`log-${log.id}-${index}`} className="border-t border-[#F4EDE2] hover:bg-[#FAF7F2] transition-colors">
                        <td className="table-cell text-xs font-semibold text-[#2C1A1D]/80 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                          })}
                        </td>
                        <td className="table-cell font-bold text-[#2C1A1D]">
                          {log.usuario_nombre}
                        </td>
                        <td className="table-cell">
                          {log.accion === 'CREAR_CORTE_SECUNDARIO' ? (
                            <span className="badge badge-warning inline-flex items-center gap-1 font-bold">
                              💸 Entrega de Efectivo
                            </span>
                          ) : log.accion === 'CORTE_CAJA' ? (
                            <span className="badge badge-success inline-flex items-center gap-1 font-bold">
                              🔒 Cierre de Caja
                            </span>
                          ) : (
                            <span className="badge badge-info font-bold">{log.accion}</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="max-w-xl break-words whitespace-normal text-xs text-[#2C1A1D] leading-relaxed font-mono bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EBE3D5]">
                            {log.detalles}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL PARA AGREGAR NUEVO DESTINATARIO */}
      {showNewRecipientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Registrar Nuevo Destinatario</h3>
            <form onSubmit={handleCreateRecipient}>
              <label className="label">Nombre completo / Concepto Destino</label>
              <input
                type="text"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                className="input-field mb-4"
                placeholder="Ej. Ing. Mario (Socio principal)"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRecipientModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Destinatario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}