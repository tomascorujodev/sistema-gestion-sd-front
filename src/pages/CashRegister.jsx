import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import '../Products.css';
import { useAuth } from '../context/AuthContext';

export default function CashRegister() {
    const { user, activeShift } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState(null);
    const [formData, setFormData] = useState({
        shift: 'Mañana',
        initialBalance: '',
        cashSales: '',
        expenses: '',
        billCount: '',
        cashWithdrawals: '',
        withdrawalEmployeeId: ''
    });
    const [successModal, setSuccessModal] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchEmployees();
        fetchSummary();
        fetchLastRegister();
    }, []);

    const fetchLastRegister = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/cashregister/last`);
            if (response.status === 200 && response.data) {
                // Set initial balance to last bill count (Arqueo de billetes)
                setFormData(prev => ({
                    ...prev,
                    initialBalance: response.data.billCount || ''
                }));
            }
        } catch (err) {
            console.error("Error fetching last register:", err);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/customerorders/summary/today`);
            setSummary(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/employees`);
            setEmployees(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const calculateBalanceDifference = () => {
        const initial = parseFloat(formData.initialBalance) || 0;
        const sales = parseFloat(formData.cashSales) || 0;
        const expenses = parseFloat(formData.expenses) || 0;
        const bills = parseFloat(formData.billCount) || 0;
        const withdrawals = parseFloat(formData.cashWithdrawals) || 0;

        const expectedBalance = initial + sales - expenses;
        const actualBalance = bills + withdrawals;
        return (expectedBalance - actualBalance).toFixed(2);
    };

    const calculateTotalWithdrawals = () => {
        const bills = parseFloat(formData.billCount) || 0;
        const withdrawals = parseFloat(formData.cashWithdrawals) || 0;
        return (bills + withdrawals).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const parseNum = (val) => {
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            };

            const data = {
                shift: formData.shift,
                initialBalance: parseNum(formData.initialBalance),
                cashSales: parseNum(formData.cashSales),
                expenses: parseNum(formData.expenses),
                billCount: parseNum(formData.billCount),
                cashWithdrawals: parseNum(formData.cashWithdrawals),
                withdrawalEmployeeId: formData.withdrawalEmployeeId ? parseInt(formData.withdrawalEmployeeId) : null,
                shiftId: activeShift ? activeShift.id : null
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/cashregister`, data);

            // Reset form
            setFormData({
                shift: 'Mañana',
                initialBalance: '',
                cashSales: '',
                expenses: '',
                billCount: '',
                cashWithdrawals: '',
                withdrawalEmployeeId: ''
            });

            setSuccessModal({
                show: true,
                message: 'El registro de caja ha sido guardado correctamente en el sistema.',
                type: 'success'
            });
        } catch (err) {
            console.error("Error saving cash register:", err);
            const serverMessage = err.response?.data;

            let errorMessage = 'Error al guardar el registro de caja. Verifique que todos los campos obligatorios estén completos.';
            if (serverMessage === "Ya existe un cierre de caja para este turno.") {
                errorMessage = "Ya existe un cierre de caja registrado para el turno actual.";
            } else if (serverMessage) {
                errorMessage = `Error del servidor: ${serverMessage}`;
            }

            setSuccessModal({
                show: true,
                message: errorMessage,
                type: 'error'
            });
        }
    };

    const isAdmin = user && user.role === 'Admin';

    return (
        <div className="container">
            <div className="page-header">
                <h1>Cierre de Caja</h1>
            </div>

            {summary && summary.count > 0 && (
                <div style={{ background: '#f8fafc', padding: '1rem 2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem', borderRadius: '0.375rem' }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Cobranzas de Pedidos Web Hoy</div>
                            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>${summary.totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {summary.details.map(d => (
                            <div key={d.method} style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.method}</div>
                                <div style={{ fontWeight: 600 }}>${d.total.toFixed(2)} ({d.count})</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="input-label">Turno *</label>
                            <select
                                value={formData.shift}
                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="Mañana">Mañana</option>
                                <option value="Tarde">Tarde</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Saldo Inicial *</label>
                            <input
                                type="number"
                                value={formData.initialBalance}
                                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                                className="input-field"
                                step="0.01"
                                placeholder="0.00"
                                required
                                readOnly
                                style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div>
                            <label className="input-label">Efectivo + Cobranzas *</label>
                            <input
                                type="number"
                                value={formData.cashSales}
                                onChange={(e) => setFormData({ ...formData, cashSales: e.target.value })}
                                className="input-field"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">Egresos {isAdmin ? '*' : '(Solo Admin)'}</label>
                            <input
                                type="number"
                                value={formData.expenses}
                                onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                                className={`input-field ${!isAdmin ? 'input-disabled' : ''}`}
                                step="0.01"
                                placeholder="0.00"
                                required={isAdmin}
                                disabled={!isAdmin}
                                style={!isAdmin ? { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' } : {}}
                            />
                            {!isAdmin && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Los egresos deben ser gestionados por un administrador.</div>}
                        </div>
                        <div>
                            <label className="input-label">Arqueo de Billetes *</label>
                            <input
                                type="number"
                                value={formData.billCount}
                                onChange={(e) => setFormData({ ...formData, billCount: e.target.value })}
                                className="input-field"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">Retiros en Efectivo *</label>
                            <input
                                type="number"
                                value={formData.cashWithdrawals}
                                onChange={(e) => setFormData({ ...formData, cashWithdrawals: e.target.value })}
                                className="input-field"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">Retiro Hecho Por</label>
                            <select
                                value={formData.withdrawalEmployeeId}
                                onChange={(e) => setFormData({ ...formData, withdrawalEmployeeId: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Seleccionar empleado</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#eef2ff', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Diferencia de Saldo con Arqueo</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                ${calculateBalanceDifference()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                (Saldo inicial + Efectivo - Egresos) - (Arqueo + Retiros)
                            </div>
                        </div>
                        <div style={{ background: '#eef2ff', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Suma de Retiros en Efectivo</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                ${calculateTotalWithdrawals()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                Arqueo de billetes + Retiros en efectivo
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                        <Plus size={20} style={{ marginRight: '0.5rem' }} />
                        Guardar Registro de Caja
                    </button>
                </form>
            </div>
            {successModal.show && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="modal-body" style={{ padding: '3rem 2rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: successModal.type === 'success' ? '#dcfce7' : '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                {successModal.type === 'success' ? (
                                    <CheckCircle size={40} color="#166534" />
                                ) : (
                                    <AlertTriangle size={40} color="#991b1b" />
                                )}
                            </div>
                            <h2 style={{
                                margin: '0 0 0.5rem 0',
                                color: '#111827'
                            }}>
                                {successModal.type === 'success' ? '¡Registro Guardado!' : 'Error en Registro'}
                            </h2>
                            <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>
                                {successModal.message}
                            </p>
                            <button
                                onClick={() => setSuccessModal({ ...successModal, show: false })}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: successModal.type === 'success' ? 'var(--primary-color)' : '#dc2626',
                                    border: 'none'
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
