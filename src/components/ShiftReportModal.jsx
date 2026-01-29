import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Check, ClipboardList, PenTool, MessageSquare, Clock, User, Calendar, DollarSign, AlertCircle, Package } from 'lucide-react';

export default function ShiftReportModal({ isOpen, onClose, shift, employee }) {
    const [reportText, setReportText] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [maintenanceTasks, setMaintenanceTasks] = useState([]);
    const [checkedTasks, setCheckedTasks] = useState({});
    const [maintenanceNotes, setMaintenanceNotes] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');
    const [cashRegisterData, setCashRegisterData] = useState(null);

    // New Fields
    const [totalSales, setTotalSales] = useState('');
    const [complaints, setComplaints] = useState('');
    const [bounces, setBounces] = useState('');
    const [stockCheck, setStockCheck] = useState('');

    useEffect(() => {
        if (isOpen && shift && employee) {
            fetchInitialData();
        }
    }, [isOpen, shift, employee]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Maintenance Tasks
            const tasksRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenancetasks`);
            const activeTasks = tasksRes.data.filter(t => t.isActive);

            // Filter tasks by branch
            const userBranch = JSON.parse(sessionStorage.getItem('user'))?.branch;
            const filteredTasks = activeTasks.filter(task => {
                // Show if task is for all branches (null or 'Ambas')
                if (!task.branch || task.branch === 'Ambas') return true;
                // Show if task matches user's branch
                return task.branch === userBranch;
            });

            setMaintenanceTasks(filteredTasks);

            const initialChecks = {};
            filteredTasks.forEach(t => initialChecks[t.id] = false);
            setCheckedTasks(initialChecks);

            // 2. Fetch Cash Register Data
            const registerRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/cashregister`);
            const today = new Date().toISOString().split('T')[0];
            const register = registerRes.data.find(r => r.date.startsWith(today));
            setCashRegisterData(register);

            // Auto-populate Total Sales if register exists
            if (register) {
                setTotalSales(register.cashSales);
            }

        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-generate report whenever inputs change
    useEffect(() => {
        if (shift && employee) {
            generateReportText();
        }
    }, [maintenanceTasks, checkedTasks, maintenanceNotes, generalNotes, cashRegisterData, shift, employee, totalSales, complaints, bounces, stockCheck]);

    const generateReportText = () => {
        const dateStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        const startTime = new Date(shift.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = new Date(shift.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

        let text = `*REPORTE DE CIERRE DE TURNO*\n`;
        text += `📅 *${formattedDate}*\n\n`;

        text += `👤 *Operador:* ${employee.name}\n`;
        text += `⏰ *Horario:* ${startTime} - ${endTime}\n`;
        text += `⏱️ *Duración:* ${shift.totalHours?.toFixed(2)} hs\n\n`;

        text += `📊 *RESUMEN OPERATIVO*\n`;
        text += `   Ventas Totales: $${Number(totalSales || 0).toLocaleString('es-AR')}\n`;
        text += `   Stock: ${stockCheck || 'Sin novedades'}\n`;
        text += `   Quejas: ${complaints || 'Ninguna'}\n`;
        text += `   Rebotes: ${bounces || 'Ninguno'}\n\n`;

        if (cashRegisterData) {
            const getIcon = (val) => val >= 0 ? '🟢' : '🔴';
            text += `💰 *DETALLE DE CAJA*\n`;
            text += `   • Inicial: $${cashRegisterData.initialBalance?.toLocaleString('es-AR')}\n`;
            text += `   • Ventas Efec.: $${cashRegisterData.cashSales?.toLocaleString('es-AR')}\n`;
            text += `   • Gastos: $${cashRegisterData.expenses?.toLocaleString('es-AR')}\n`;
            text += `   ---------------------------\n`;
            text += `   • Diferencia: $${cashRegisterData.balanceDifference?.toLocaleString('es-AR')} ${getIcon(cashRegisterData.balanceDifference)}\n`;
            text += `   • Total Retirado: $${cashRegisterData.totalWithdrawals?.toLocaleString('es-AR')}\n\n`;
        }

        text += `🛠️ *MANTENIMIENTO*\n`;
        const completedTasks = maintenanceTasks.filter(t => checkedTasks[t.id]);
        const incompleteTasks = maintenanceTasks.filter(t => !checkedTasks[t.id]);

        if (completedTasks.length > 0) {
            text += `   ✅ Realizado:\n`;
            completedTasks.forEach(t => text += `      - ${t.description}\n`);
        } else {
            text += `   ⚠️ No se registraron tareas completadas.\n`;
        }

        if (incompleteTasks.length > 0) {
            text += `   ❌ No Realizado:\n`;
            incompleteTasks.forEach(t => text += `      - ${t.description}\n`);
        }

        if (maintenanceNotes.trim()) {
            text += `   📝 Notas Mant.: ${maintenanceNotes}\n`;
        }
        text += `\n`;

        if (generalNotes.trim()) {
            text += `📌 *NOTAS GENERALES*\n${generalNotes}\n`;
        }

        setReportText(text);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(reportText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleTask = (id) => {
        setCheckedTasks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSaveAndClose = async () => {
        setSaving(true);
        try {
            const reportData = {
                shiftData: reportText,
                maintenanceTasksCompleted: Object.values(checkedTasks).some(v => v), // True if at least one task is done
                totalSales: Number(totalSales) || 0,
                complaints: complaints || '',
                bounces: bounces || '',
                stockCheck: stockCheck || ''
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/dailyreports`, reportData);

            // Automatically copy to clipboard before closing
            navigator.clipboard.writeText(reportText);

            onClose();
        } catch (error) {
            console.error("Failed to save report", error);
            alert("Error al guardar el informe. Por favor verifique su conexión.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', height: '90vh', padding: '0', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="modal-header" style={{ background: 'var(--primary-color)', color: 'white', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ClipboardList size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Finalizar y Guardar Informe</h2>
                    </div>
                </div>

                <div className="modal-body" style={{ flex: 1, display: 'flex', gap: '2rem', padding: '2rem', overflow: 'hidden' }}>

                    {/* Left Column: Input Form */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Section: Key Metrics */}
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}>
                                <DollarSign size={18} /> Métricas Clave
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="input-label">Ventas Totales ($)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={totalSales}
                                        onChange={e => setTotalSales(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Rebotes / Devoluciones</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={bounces}
                                        onChange={e => setBounces(e.target.value)}
                                        placeholder="Ej: 1 devolución"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Operational Info */}
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}>
                                <AlertCircle size={18} /> Incidencias y Stock
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="input-label">Quejas / Reclamos</label>
                                    <textarea
                                        className="input-field"
                                        value={complaints}
                                        onChange={e => setComplaints(e.target.value)}
                                        placeholder="Detalle aquí si hubo quejas de clientes..."
                                        style={{ minHeight: '60px' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Novedades de Stock</label>
                                    <textarea
                                        className="input-field"
                                        value={stockCheck}
                                        onChange={e => setStockCheck(e.target.value)}
                                        placeholder="Faltantes, productos por agotarse, etc..."
                                        style={{ minHeight: '60px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Maintenance */}
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}>
                                <PenTool size={18} /> Mantenimiento
                            </h4>
                            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                                {maintenanceTasks.map(task => (
                                    <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: checkedTasks[task.id] ? '#ecfdf5' : '#f8fafc', transition: 'all 0.2s' }}>
                                        <input
                                            type="checkbox"
                                            checked={checkedTasks[task.id] || false}
                                            onChange={() => toggleTask(task.id)}
                                            style={{ width: '1.2rem', height: '1.2rem', accentColor: '#10b981' }}
                                        />
                                        <span style={{ flex: 1, fontSize: '0.95rem', color: checkedTasks[task.id] ? '#065f46' : '#334155' }}>
                                            {task.description}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                                            {task.frequency}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <textarea
                                value={maintenanceNotes}
                                onChange={(e) => setMaintenanceNotes(e.target.value)}
                                placeholder="Observaciones adicionales de limpieza..."
                                className="input-field"
                                style={{ fontSize: '0.9rem', minHeight: '60px' }}
                            />
                        </div>

                        {/* Section: General Notes */}
                        <div>
                            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}>
                                <MessageSquare size={18} /> Notas Generales
                            </h4>
                            <textarea
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                                placeholder="Cualquier otra novedad para el equipo..."
                                className="input-field"
                                style={{ fontSize: '0.9rem', minHeight: '80px' }}
                            />
                        </div>

                    </div>

                    {/* Right Column: Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>Vista Previa</h3>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: copied ? 'var(--primary-color)' : 'white',
                                    color: copied ? 'white' : '#333',
                                    border: '1px solid #ddd',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copiado!' : 'Copiar Texto'}
                            </button>
                        </div>
                        <div style={{
                            flex: 1,
                            background: 'white',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                            color: '#333',
                            fontSize: '0.9rem',
                            border: '1px solid #ddd'
                        }}>
                            {loading ? 'Cargando datos...' : reportText}
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                            Este informe se guardará automáticamente al finalizar.
                        </p>
                    </div>

                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={handleSaveAndClose}
                        className="btn btn-primary"
                        style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : (
                            <>
                                <Check size={18} /> Confirmar y Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
}
