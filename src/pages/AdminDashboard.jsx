import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Trash2, Edit, AlertCircle, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, AlertTriangle } from 'lucide-react';
import '../Products.css';

export default function AdminDashboard() {
    const [cashRegisters, setCashRegisters] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [uncontrolledSum, setUncontrolledSum] = useState(0);
    const [successModal, setSuccessModal] = useState({ show: false, message: '', type: 'success' });

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [formData, setFormData] = useState({
        shift: 'Mañana',
        initialBalance: '',
        cashSales: '',
        expenses: '',
        billCount: '',
        cashWithdrawals: '',
        withdrawalEmployeeId: '',
        status: 'Pendiente'
    });

    useEffect(() => {
        fetchCashRegisters();
        fetchEmployees();
    }, [page, pageSize, filterStatus]);

    const fetchCashRegisters = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5027/api/cashregister', {
                params: { page, pageSize, status: filterStatus }
            });
            if (response.data.items) {
                setCashRegisters(response.data.items);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalCount);
                setUncontrolledSum(response.data.uncontrolledSum || 0);
            } else {
                setCashRegisters(response.data);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };


    const fetchEmployees = async () => {
        try {
            const response = await axios.get('http://localhost:5027/api/employees');
            setEmployees(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este registro?')) {
            try {
                await axios.delete(`http://localhost:5027/api/cashregister/${id}`);
                setCashRegisters(cashRegisters.filter(c => c.id !== id));
            } catch (err) {
                alert('Failed to delete entry');
            }
        }
    };

    const handleEdit = (cr) => {
        setEditingId(cr.id);
        setFormData({
            shift: cr.shift,
            initialBalance: cr.initialBalance,
            cashSales: cr.cashSales,
            expenses: cr.expenses,
            billCount: cr.billCount,
            cashWithdrawals: cr.cashWithdrawals,
            withdrawalEmployeeId: cr.withdrawalEmployeeId || '',
            status: cr.status || 'Pendiente'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            shift: 'Mañana',
            initialBalance: '',
            cashSales: '',
            expenses: '',
            billCount: '',
            cashWithdrawals: '',
            withdrawalEmployeeId: '',
            status: 'Pendiente'
        });
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
            const data = {
                shift: formData.shift,
                initialBalance: parseFloat(formData.initialBalance),
                cashSales: parseFloat(formData.cashSales),
                expenses: parseFloat(formData.expenses),
                billCount: parseFloat(formData.billCount),
                cashWithdrawals: parseFloat(formData.cashWithdrawals),
                withdrawalEmployeeId: formData.withdrawalEmployeeId ? parseInt(formData.withdrawalEmployeeId) : null,
                status: formData.status,
                id: editingId
            };

            await axios.put(`http://localhost:5027/api/cashregister/${editingId}`, data);

            setSuccessModal({
                show: true,
                message: 'El registro ha sido actualizado correctamente.',
                type: 'success'
            });

            setEditingId(null);
            fetchCashRegisters();
        } catch (err) {
            console.error(err);
            setSuccessModal({
                show: true,
                message: 'Hubo un error al actualizar el registro. Intente nuevamente.',
                type: 'error'
            });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    if (loading && !cashRegisters.length && page === 1) return <div className="loading-container">Loading...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Historial de Caja</h1>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {totalRecords} {totalRecords === 1 ? 'registro' : 'registros'} en total
                </div>
            </div>

            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #ffedd5', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#fb923c', padding: '0.5rem', borderRadius: '0.375rem', color: 'white' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#9a3412', fontWeight: 600 }}>Suma de Sobres No Controlados</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c2410c' }}>${uncontrolledSum.toFixed(2)}</div>
                    </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ea580c' }}>
                    Incluye cierres pendientes y retirados no verificados.
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['all', 'Pendiente', 'Retirado', 'Controlado'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {status === 'all' ? 'Todos' : status}
                    </button>
                ))}
            </div>

            {editingId && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '2px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Cierre</h2>
                        <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                            <X size={24} />
                        </button>
                    </div>

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
                                    required
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
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Egresos (Editable) *</label>
                                <input
                                    type="number"
                                    value={formData.expenses}
                                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                                    className="input-field"
                                    step="0.01"
                                    required
                                    style={{ borderColor: 'var(--primary-color)', backgroundColor: '#f0f9ff' }}
                                />
                            </div>
                            <div>
                                <label className="input-label">Arqueo de Billetes *</label>
                                <input
                                    type="number"
                                    value={formData.billCount}
                                    onChange={(e) => setFormData({ ...formData, billCount: e.target.value })}
                                    className="input-field"
                                    step="0.01"
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
                            <div>
                                <label className="input-label">Estado</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Retirado">Retirado</option>
                                    <option value="Controlado">Controlado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Diferencia Calculada</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                    ${calculateBalanceDifference()}
                                </div>
                            </div>
                            <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Retiros</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                    ${calculateTotalWithdrawals()}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Turno</th>
                            <th>Saldo Inicial</th>
                            <th>Efectivo + Cobranzas</th>
                            <th>Egresos</th>
                            <th>Arqueo Billetes</th>
                            <th>Retiros Efectivo</th>
                            <th>Diferencia</th>
                            <th>Retiro Por</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cashRegisters.map((item) => (
                            <tr key={item.id} style={item.isEdited ? { backgroundColor: '#fffbeb' } : {}}>
                                <td>{new Date(item.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
                                <td>{item.shift}</td>
                                <td>${item.initialBalance.toFixed(2)}</td>
                                <td>${item.cashSales.toFixed(2)}</td>
                                <td>${item.expenses.toFixed(2)}</td>
                                <td>${item.billCount.toFixed(2)}</td>
                                <td>${item.cashWithdrawals.toFixed(2)}</td>
                                <td style={{ color: item.balanceDifference != 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                                    ${item.balanceDifference.toFixed(2)}
                                </td>
                                <td>{item.withdrawalEmployee?.name || '-'}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: item.status === 'Controlado' ? '#dcfce7' : item.status === 'Retirado' ? '#f3f4f6' : '#fef3c7',
                                        color: item.status === 'Controlado' ? '#166534' : item.status === 'Retirado' ? '#374151' : '#92400e'
                                    }}>
                                        {item.status || 'Pendiente'}
                                    </span>
                                    {item.isEdited && (
                                        <div style={{ display: 'flex', alignItems: 'center', color: '#d97706', fontSize: '0.7rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                            <AlertCircle size={10} style={{ marginRight: '2px' }} /> Editado
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="icon-btn edit-btn"
                                            onClick={() => handleEdit(item)}
                                            style={{ color: '#2563eb' }}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="icon-btn delete-btn"
                                            onClick={() => handleDelete(item.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {cashRegisters.length === 0 && (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No hay registros de caja aún
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalRecords > 0 && (
                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</label>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                background: 'white'
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>por página</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Página {page} de {totalPages}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: page === 1 ? '#f1f5f9' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: page === 1 ? '#f1f5f9' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: page === totalPages ? '#f1f5f9' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: page === totalPages ? '#f1f5f9' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}

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
                                {successModal.type === 'success' ? '¡Operación Exitosa!' : 'Error'}
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
