import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export default function PendingInvoices({ onPayAction }) {
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
            if (statusFilter === 'Pendiente') {
                data = data.filter(i => i.status === 'Pendiente' || i.status === 'Parcial');
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
                                            <td>{invoice.invoiceNumber}</td>
                                            <td>{getStatusBadge(invoice.status)}</td>
                                            <td style={{ fontWeight: 600 }}>${invoice.totalAmount.toFixed(2)}</td>
                                            <td style={{ color: '#10b981' }}>${invoice.paidAmount.toFixed(2)}</td>
                                            <td style={{ color: '#f59e0b', fontWeight: 700 }}>${saldo.toFixed(2)}</td>
                                            <td>
                                                {invoice.status !== 'Pagado' && (
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
