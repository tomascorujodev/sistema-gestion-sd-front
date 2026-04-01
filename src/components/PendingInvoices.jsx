import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PendingInvoices({ onPayAction }) {
    const { user } = useAuth();
    const isOperator = user?.role === 'Operator';
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Pendiente'); // 'All', 'Pendiente', 'Pagado'

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_URL}/api/supplierinvoices`;
            if (statusFilter !== 'All') {
                url += `?status=${statusFilter}`;
            }
            // If filter is "Pendiente", we might also want "Parcial"

            const response = await axios.get(url);

            let data = response.data;
            if (statusFilter !== 'All') {
                data = data.filter(i => i.status === statusFilter);
            }

            setInvoices(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pagado': return <span className="status-badge success">Pagado</span>;
            case 'Pendiente': return <span className="status-badge warning">Pendiente</span>;
            case 'Parcial': return <span className="status-badge info">Parcial</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const handleAssign = async (invoice, field, value) => {
        try {
            const updatedInvoice = { ...invoice, [field]: value };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/supplierinvoices/${invoice.id}`, updatedInvoice);
            setInvoices(invoices.map(i => i.id === invoice.id ? updatedInvoice : i));
        } catch (err) {
            console.error('Error actualizando asignación:', err);
        }
    };

    return (
        <div className="pending-invoices-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Proveedores Pendientes (Facturas)</h2>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setStatusFilter('Pendiente')}
                        className={`btn ${statusFilter === 'Pendiente' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setStatusFilter('Parcial')}
                        className={`btn ${statusFilter === 'Parcial' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Parciales
                    </button>
                    <button
                        onClick={() => setStatusFilter('Pagado')}
                        className={`btn ${statusFilter === 'Pagado' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Pagados
                    </button>
                    <button
                        onClick={() => setStatusFilter('All')}
                        className={`btn ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Todos
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">Cargando facturas...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha Venc.</th>
                                <th>Proveedor</th>
                                <th>Factura</th>
                                <th>Estado</th>
                                <th>Importe</th>
                                <th>Pagado</th>
                                <th>Saldo</th>
                                <th>Día</th>
                                <th>Semana</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? (
                                invoices.map(invoice => {
                                    const saldo = invoice.totalAmount - invoice.paidAmount;
                                    const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'Pagado';

                                    return (
                                        <tr key={invoice.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                                                    {isOverdue && <AlertCircle size={16} />}
                                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>{invoice.supplier?.name}</td>
                                            <td style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={invoice.invoiceNumber}>
                                                {invoice.invoiceNumber}
                                            </td>
                                            <td>{getStatusBadge(invoice.status)}</td>
                                            <td style={{ fontWeight: 600 }}>${invoice.totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td style={{ color: '#10b981' }}>${invoice.paidAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td style={{ color: '#f59e0b', fontWeight: 700 }}>${saldo.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td>
                                                <select
                                                    value={invoice.assignedDay || ''}
                                                    onChange={(e) => handleAssign(invoice, 'assignedDay', e.target.value)}
                                                    className="input-field"
                                                    style={{ padding: '0.25rem', fontSize: '0.85rem', width: 'auto', backgroundColor: (invoice.status === 'Pagado' || isOperator) ? '#f8fafc' : 'white', cursor: (invoice.status === 'Pagado' || isOperator) ? 'not-allowed' : 'pointer' }}
                                                    disabled={invoice.status === 'Pagado' || isOperator}
                                                >
                                                    <option value="">- Día -</option>
                                                    <option value="Lunes">Lunes</option>
                                                    <option value="Martes">Martes</option>
                                                    <option value="Miércoles">Miércoles</option>
                                                    <option value="Jueves">Jueves</option>
                                                    <option value="Viernes">Viernes</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    value={invoice.assignedWeek || ''}
                                                    onChange={(e) => handleAssign(invoice, 'assignedWeek', e.target.value)}
                                                    className="input-field"
                                                    style={{ padding: '0.25rem', fontSize: '0.85rem', width: 'auto', backgroundColor: (invoice.status === 'Pagado' || isOperator) ? '#f8fafc' : 'white', cursor: (invoice.status === 'Pagado' || isOperator) ? 'not-allowed' : 'pointer' }}
                                                    disabled={invoice.status === 'Pagado' || isOperator}
                                                >
                                                    <option value="">- Semana -</option>
                                                    <option value="Semana 1">Semana 1</option>
                                                    <option value="Semana 2">Semana 2</option>
                                                    <option value="Semana 3">Semana 3</option>
                                                    <option value="Semana 4">Semana 4</option>
                                                    <option value="Semana 5">Semana 5</option>
                                                </select>
                                            </td>
                                            <td>
                                                {invoice.status !== 'Pagado' && !isOperator && (
                                                    <button
                                                        onClick={() => onPayAction(invoice)}
                                                        className="btn btn-sm btn-primary"
                                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                                    >
                                                        Registrar Pago
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        No hay facturas en este estado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
