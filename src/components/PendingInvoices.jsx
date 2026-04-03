import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, AlertCircle, Calendar, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PendingInvoices({ onPayAction }) {
    const { user } = useAuth();
    const isOperator = user?.role === 'Operator';
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Pendiente'); // 'All', 'Pendiente', 'Pagado'
    const [deleteModalInvoice, setDeleteModalInvoice] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, pageSize]);

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter, page, pageSize]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = { page, pageSize };
            if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/supplierinvoices`, { params });

            if (response.data.items) {
                setInvoices(response.data.items);
                setTotalPages(response.data.totalPages || 1);
                setTotalRecords(response.data.totalCount || 0);
            } else {
                // Retrocompatibilidad defensiva
                let data = response.data;
                if (statusFilter !== 'All') {
                    data = data.filter(i => i.status === statusFilter);
                }
                setInvoices(data);
                setTotalPages(1);
                setTotalRecords(data.length);
            }
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

    const confirmDelete = async () => {
        if (!deleteModalInvoice) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/supplierinvoices/${deleteModalInvoice.id}`);
            setInvoices(invoices.filter(i => i.id !== deleteModalInvoice.id));
            setDeleteModalInvoice(null);
        } catch (err) {
            console.error('Error al eliminar la factura:', err);
            alert('Ocurrió un error al intentar eliminar la factura. Es posible que tenga pagos asociados.');
            setDeleteModalInvoice(null);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
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
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {invoice.status !== 'Pagado' && !isOperator && (
                                                        <button
                                                            onClick={() => onPayAction(invoice)}
                                                            className="btn btn-sm btn-primary"
                                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                                        >
                                                            Registrar Pago
                                                        </button>
                                                    )}
                                                    {!isOperator && (
                                                        <button
                                                            onClick={() => setDeleteModalInvoice(invoice)}
                                                            className="btn btn-sm"
                                                            style={{ padding: '0.4rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
                                                            title="Eliminar factura"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
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

            {totalRecords > 0 && !loading && (
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: '#64748b' }}>Mostrar:</label>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>por página</span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                        Página {page} de {totalPages} ({totalRecords} resultados)
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            className="btn btn-sm"
                            style={{ padding: '0.5rem', background: page === 1 ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', color: page === 1 ? '#cbd5e1' : '#475569', cursor: page === 1 ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="btn btn-sm"
                            style={{ padding: '0.5rem', background: page === 1 ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', color: page === 1 ? '#cbd5e1' : '#475569', cursor: page === 1 ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="btn btn-sm"
                            style={{ padding: '0.5rem', background: page === totalPages ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', color: page === totalPages ? '#cbd5e1' : '#475569', cursor: page === totalPages ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            className="btn btn-sm"
                            style={{ padding: '0.5rem', background: page === totalPages ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', color: page === totalPages ? '#cbd5e1' : '#475569', cursor: page === totalPages ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {deleteModalInvoice && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', borderRadius: '0.5rem' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>Confirmar Eliminación</h2>
                            <button
                                onClick={() => setDeleteModalInvoice(null)}
                                className="close-btn"
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem', color: '#475569' }}>
                            <p>¿Estás seguro de que deseas eliminar la factura <strong>#{deleteModalInvoice.invoiceNumber}</strong>?<br /><br />Esta acción no se puede deshacer y borrará permanentemente todo registro de este saldo.</p>
                        </div>
                        <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setDeleteModalInvoice(null)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn"
                                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
