import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Eye, Package, DollarSign, CheckCircle, Check } from 'lucide-react';
import '../Products.css';

export default function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        product: '',
        amount: '',
        description: '',
        isPaid: false,
        employeeInChargeId: '',
        paymentMode: 'Efectivo',
        salesChannel: 'Tienda',
        status: 'Pendiente'
    });
    const [filterStatus, setFilterStatus] = useState('all');

    const [viewModal, setViewModal] = useState({ show: false, order: null });
    const [paymentModal, setPaymentModal] = useState({
        show: false,
        order: null,
        paymentMethod: 'Efectivo',
        status: 'idle', // idle, loading, error
        message: ''
    });
    const [successModal, setSuccessModal] = useState({ show: false, message: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchOrders();
        fetchEmployees();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:5027/api/customerorders');
            setOrders(response.data);
            setLoading(false);
        } catch (err) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                amount: parseFloat(formData.amount) || 0,
                employeeInChargeId: formData.employeeInChargeId ? parseInt(formData.employeeInChargeId) : null
            };
            const response = await axios.post('http://localhost:5027/api/customerorders', data);
            setOrders([response.data, ...orders]);
            setIsModalOpen(false);
            setFormData({
                customerName: '',
                phone: '',
                product: '',
                amount: '',
                description: '',
                isPaid: false,
                employeeInChargeId: '',
                paymentMode: 'Efectivo',
                salesChannel: 'Tienda',
                status: 'Pendiente'
            });
        } catch (err) {
            showToast('Error al crear el pedido. Verifique los datos.', 'error');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.put(`http://localhost:5027/api/customerorders/${id}/status`, `"${newStatus}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            showToast('Estado actualizado correctamente');
        } catch (err) {
            showToast('Error al actualizar el estado del pedido.', 'error');
        }
    };

    const handleViewDetails = (order) => {
        setViewModal({ show: true, order });
    };

    const handleMarkAsPaid = async () => {
        try {
            setPaymentModal(prev => ({ ...prev, status: 'loading' }));
            await axios.post(`http://localhost:5027/api/customerorders/${paymentModal.order.id}/pay`, {
                paymentMethod: paymentModal.paymentMethod
            });

            setOrders(orders.map(o =>
                o.id === paymentModal.order.id
                    ? { ...o, isPaid: true, paymentMode: paymentModal.paymentMethod }
                    : o
            ));

            // Close confirmation modal and show success modal
            setPaymentModal({ show: false, order: null, paymentMethod: 'Efectivo', status: 'idle', message: '' });
            setSuccessModal({ show: true, message: 'El pago ha sido registrado correctamente en el sistema.' });

        } catch (err) {
            setPaymentModal(prev => ({
                ...prev,
                status: 'error',
                message: err.response?.data || 'No se pudo registrar el pago. Verifique su conexión.'
            }));
        }
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendiente': return '#f59e0b';
            case 'En Preparación': return '#3b82f6';
            case 'Listo': return '#10b981';
            case 'Entregado': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (loading) return <div className="loading-container">Loading...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Pedidos de Clientes</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Nuevo Pedido
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterStatus('all')}
                >
                    Todos ({orders.length})
                </button>
                <button
                    className={`btn ${filterStatus === 'Pendiente' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterStatus('Pendiente')}
                >
                    Pendiente ({orders.filter(o => o.status === 'Pendiente').length})
                </button>
                <button
                    className={`btn ${filterStatus === 'En Preparación' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterStatus('En Preparación')}
                >
                    En Preparación ({orders.filter(o => o.status === 'En Preparación').length})
                </button>
                <button
                    className={`btn ${filterStatus === 'Listo' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterStatus('Listo')}
                >
                    Listo ({orders.filter(o => o.status === 'Listo').length})
                </button>
                <button
                    className={`btn ${filterStatus === 'Entregado' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterStatus('Entregado')}
                >
                    Entregado ({orders.filter(o => o.status === 'Entregado').length})
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Teléfono</th>
                            <th>Producto</th>
                            <th>Encargado</th>
                            <th>Canal</th>
                            <th>Monto</th>
                            <th>Pago</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id}>
                                <td>{new Date(order.orderDate).toLocaleDateString('es-AR')}</td>
                                <td>{order.customerName}</td>
                                <td>{order.phone}</td>
                                <td>{order.product}</td>
                                <td>{order.employeeInCharge?.name || '-'}</td>
                                <td>{order.salesChannel}</td>
                                <td style={{ fontWeight: 600 }}>${order.amount?.toFixed(2) || '0.00'}</td>
                                <td>
                                    <span className={`status-badge ${order.isPaid ? 'received' : 'pending'}`}>
                                        {order.isPaid ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{
                                            padding: '0.15rem 0.25rem',
                                            borderRadius: '0.25rem',
                                            border: `1px solid ${getStatusColor(order.status)}`,
                                            color: getStatusColor(order.status),
                                            fontWeight: 600,
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="En Preparación">En Preparación</option>
                                        <option value="Listo">Listo</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {!order.isPaid && (
                                            <button
                                                className="icon-btn"
                                                title="Marcar como pagado"
                                                onClick={() => setPaymentModal({ show: true, order, paymentMethod: 'Efectivo', status: 'idle', message: '' })}
                                                style={{ backgroundColor: '#10b981', color: 'white' }}
                                            >
                                                <DollarSign size={16} />
                                            </button>
                                        )}
                                        <button className="icon-btn" title="Ver detalles" onClick={() => handleViewDetails(order)}>
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Nuevo Pedido de Cliente</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nombre Cliente *</label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        required
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono *</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Producto *</label>
                                <input
                                    type="text"
                                    value={formData.product}
                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Monto ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="input-field"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field"
                                    rows="3"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Encargado</label>
                                    <select
                                        value={formData.employeeInChargeId}
                                        onChange={(e) => setFormData({ ...formData, employeeInChargeId: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Sin asignar</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Modo de Pago</label>
                                    <select
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Canal de Venta</label>
                                    <select
                                        value={formData.salesChannel}
                                        onChange={(e) => setFormData({ ...formData, salesChannel: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Tienda">Tienda</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Teléfono">Teléfono</option>
                                        <option value="Instagram">Instagram</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPaid}
                                            onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                                        />
                                        Pagado
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Crear Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewModal.show && viewModal.order && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', padding: '0' }}>
                        <div className="modal-header">
                            <h2>Detalles del Pedido</h2>
                            <button onClick={() => setViewModal({ show: false, order: null })} className="close-btn">×</button>
                        </div>
                        <div className="order-details" style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Cliente</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.customerName}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Teléfono</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.phone}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Monto</strong>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>${viewModal.order.amount?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Producto</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.product}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Fecha</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{new Date(viewModal.order.orderDate).toLocaleString('es-AR')}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Encargado</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.employeeInCharge?.name || 'Sin asignar'}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Canal de Venta</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.salesChannel}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Modo de Pago</strong>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>{viewModal.order.paymentMode}</p>
                                </div>
                                <div>
                                    <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Estado de Pago</strong>
                                    <span className={`status-badge ${viewModal.order.isPaid ? 'received' : 'pending'}`} style={{ display: 'inline-block', marginTop: '0.25rem' }}>
                                        {viewModal.order.isPaid ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Descripción</strong>
                                <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#4b5563', lineHeight: '1.5' }}>
                                    {viewModal.order.description || 'Sin descripción'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                <strong style={{ color: '#111827' }}>Estado del Pedido:</strong>
                                <span
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '9999px',
                                        backgroundColor: getStatusColor(viewModal.order.status),
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {viewModal.order.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {paymentModal.show && paymentModal.order && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2>Confirmar Pago</h2>
                            {paymentModal.status === 'idle' && (
                                <button onClick={() => setPaymentModal({ show: false, order: null, paymentMethod: 'Efectivo', status: 'idle', message: '' })} className="close-btn">×</button>
                            )}
                        </div>

                        <div className="modal-body">
                            {paymentModal.status === 'idle' && (
                                <>
                                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Detalles de Cobro</div>
                                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>{paymentModal.order.product}</p>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>Cliente: {paymentModal.order.customerName}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #d1d5db' }}>
                                            <span style={{ fontWeight: 600, color: '#374151' }}>Importe:</span>
                                            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#9D3E3C' }}>${paymentModal.order.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Seleccionar Método de Pago</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {['Efectivo', 'Tarjeta', 'Transferencia', 'MercadoPago'].map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setPaymentModal({ ...paymentModal, paymentMethod: method })}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: '0.5rem',
                                                        border: paymentModal.paymentMethod === method ? '2px solid #9D3E3C' : '1px solid #d1d5db',
                                                        backgroundColor: paymentModal.paymentMethod === method ? '#fef2f2' : 'white',
                                                        color: paymentModal.paymentMethod === method ? '#9D3E3C' : '#374151',
                                                        fontWeight: paymentModal.paymentMethod === method ? 600 : 400,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a', display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>
                                            El ingreso se registrará en la cuenta de <strong>{paymentModal.paymentMethod}</strong>.
                                        </p>
                                    </div>
                                </>
                            )}

                            {paymentModal.status === 'loading' && (
                                <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                                    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #9D3E3C', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                                    <p style={{ color: '#6b7280' }}>Registrando pago en sistema...</p>
                                </div>
                            )}

                            {paymentModal.status === 'error' && (
                                <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <div style={{ color: '#991b1b', fontSize: '2rem' }}>✕</div>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Error de Sistema</h3>
                                    <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{paymentModal.message}</p>
                                    <button
                                        onClick={() => setPaymentModal(prev => ({ ...prev, status: 'idle' }))}
                                        className="btn btn-primary"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}
                        </div>

                        {paymentModal.status === 'idle' && (
                            <div className="modal-footer">
                                <button
                                    onClick={() => setPaymentModal({ show: false, order: null, paymentMethod: 'Efectivo', status: 'idle', message: '' })}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMarkAsPaid}
                                    className="btn btn-primary"
                                    style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                                >
                                    Confirmar Pago
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {successModal.show && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="modal-body" style={{ padding: '3rem 2rem' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={40} color="#166534" />
                            </div>
                            <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>¡Pago Confirmado!</h2>
                            <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>
                                {successModal.message}
                            </p>
                            <button
                                onClick={() => setSuccessModal({ show: false, message: '' })}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '0.75rem' }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    backgroundColor: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: toast.type === 'error' ? '#991b1b' : '#166534',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    zIndex: 2000,
                    animation: 'slideIn 0.3s ease-out',
                    border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`
                }}>
                    {toast.type === 'error' ? <X size={18} /> : <Check size={18} />}
                    <span style={{ fontWeight: 500 }}>{toast.message}</span>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
