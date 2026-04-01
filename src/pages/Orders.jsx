import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Eye, CheckCircle, Truck, Package, DollarSign, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css'; // Reuse table styles
import '../Orders.css'; // Specific styles

export default function Orders({ isSubComponent = false }) {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);

    // NEW: Search and Edit states
    const [productSearch, setProductSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, id: null, action: '', title: '', message: '' });
    const [newOrder, setNewOrder] = useState({ supplierId: '', branch: 'Sucursal Principal', paymentMethod: 'Efectivo', items: [] });
    const [newItem, setNewItem] = useState({ productId: '', quantity: 1, unitPrice: 0, details: '' });
    const [viewModal, setViewModal] = useState({ show: false, order: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, suppliersRes, categoriesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/supplierorders`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/suppliers`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/products/categories`)
            ]);
            setOrders(ordersRes.data);
            setSuppliers(suppliersRes.data);
            setCategories(categoriesRes.data || []);
            setLoading(false);
            
            // Initial product fetch
            fetchProductsList('');
        } catch (err) {
            console.error(err);
            setError('Error al cargar datos');
            setLoading(false);
        }
    };

    const fetchProductsList = async (searchVal) => {
        setSearchingProducts(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
                params: {
                    pageSize: 100, // Reasonable limit for common searches
                    search: searchVal,
                    category: categoryFilter
                }
            });
            setFilteredProducts(response.data.items || []);
            // Also update all products if it was the initial fetch
            if (!searchVal && !categoryFilter) {
                setProducts(response.data.items || []);
            }
        } catch (err) {
            console.error('Error searching products:', err);
        } finally {
            setSearchingProducts(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        // Skip initial wait if everything is empty
        if (!productSearch && !categoryFilter) {
            fetchProductsList('');
            return;
        }

        const timer = setTimeout(() => {
            fetchProductsList(productSearch);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [productSearch, categoryFilter]);

    const handleAddItem = () => {
        if (!newItem.productId || newItem.quantity <= 0) return;

        // Search in both initial products and search results
        const product = filteredProducts.find(p => p.id === parseInt(newItem.productId)) || 
                        products.find(p => p.id === parseInt(newItem.productId));
        
        if (!product) {
            console.error('Product not found:', newItem.productId);
            alert('Error: No se pudo encontrar el producto seleccionado. Intente buscarlo de nuevo.');
            return;
        }

        const item = {
            ...newItem,
            productName: product.name,
            productId: parseInt(newItem.productId),
            quantity: parseFloat(newItem.quantity),
            unitPrice: parseFloat(newItem.unitPrice),
            salePrice: product.price // Save original sale price
        };

        setNewOrder({ ...newOrder, items: [...newOrder.items, item] });
        setNewItem({ productId: '', quantity: 1, unitPrice: 0, details: '' });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = newOrder.items.filter((_, i) => i !== index);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (newOrder.items.length === 0) {
            alert('Debe agregar al menos un producto al pedido.');
            return;
        }

        try {
            const payload = {
                supplierId: parseInt(newOrder.supplierId),
                branch: newOrder.branch,
                paymentMethod: newOrder.paymentMethod,
                status: 'Sin Enviar',
                orderDate: new Date().toISOString(),
                items: newOrder.items.map(item => ({
                    id: item.id || 0, // Include ID if editing
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    details: item.details
                }))
            };

            if (isEditing) {
                payload.id = currentEditId;
                await axios.put(`${import.meta.env.VITE_API_URL}/api/supplierorders/${currentEditId}`, payload);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/supplierorders`, payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} el pedido`);
        }
    };

    const resetForm = () => {
        setNewOrder({ supplierId: '', branch: 'Sucursal Principal', paymentMethod: 'Efectivo', items: [] });
        setNewItem({ productId: '', quantity: 1, unitPrice: 0, details: '' });
        setIsEditing(false);
        setCurrentEditId(null);
        setProductSearch('');
    };

    const handleEditOrder = (order) => {
        setNewOrder({
            supplierId: order.supplierId,
            branch: order.branch,
            paymentMethod: order.paymentMethod,
            items: (order.items || []).map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.product?.name || 'Producto',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                salePrice: item.product?.price || 0,
                details: item.details
            }))
        });
        setIsEditing(true);
        setCurrentEditId(order.id);
        setIsModalOpen(true);
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm('¿Confirmar que desea anular este pedido? Esta acción no se puede deshacer.')) return;
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/supplierorders/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar el pedido. Verifique que tenga permisos de administrador.');
        }
    };

    const handleStatusAction = (id, action) => {
        let title = '';
        let message = '';

        switch (action) {
            case 'send':
                title = 'Marcar como Enviado';
                message = '¿Confirmar que el pedido ha sido enviado al proveedor?';
                break;
            case 'receive':
                title = 'Recibir Pedido';
                message = '¿Confirmar la recepción del pedido? Esto actualizará el stock y establecerá la fecha de pago.';
                break;
            case 'pay':
                title = 'Marcar como Pagado';
                message = '¿Confirmar que se ha realizado el pago de este pedido?';
                break;
            default:
                return;
        }

        setStatusModal({ show: true, id, action, title, message });
    };

    const confirmStatusChange = async () => {
        try {
            const { id, action } = statusModal;
            if (action === 'send') {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/supplierorders/${id}/status`, '"Enviado"', {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else if (action === 'receive') {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/supplierorders/${id}/mark-received`);
            } else if (action === 'pay') {
                // For simplicity, using a dummy invoice number or prompting for it could be better
                await axios.put(`${import.meta.env.VITE_API_URL}/api/supplierorders/${id}/mark-paid`, '"REF-PAGO"', {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            fetchData();
            setStatusModal({ show: false, id: null, action: '', title: '', message: '' });
        } catch (err) {
            console.error(err);
            alert('Error al actualizar el estado del pedido');
            setStatusModal({ show: false, id: null, action: '', title: '', message: '' });
        }
    };

    if (loading) return <div className="loading-container">Cargando pedidos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className={isSubComponent ? "" : "container"}>
            <ConfirmationModal
                isOpen={statusModal.show}
                onClose={() => setStatusModal({ ...statusModal, show: false })}
                onConfirm={confirmStatusChange}
                title={statusModal.title}
                message={statusModal.message}
                confirmText="Confirmar"
                isDestructive={false}
            />

            {!isSubComponent && (
                <div className="page-header">
                    <h1>Pedidos Proveedores</h1>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={16} style={{ marginRight: '0.5rem' }} />
                        Nuevo Pedido
                    </button>
                </div>
            )}

            {isSubComponent && (
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={16} style={{ marginRight: '0.5rem' }} />
                        Nuevo Pedido
                    </button>
                </div>
            )}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Sucursal</th>
                            <th>Estado</th>
                            <th>Total Est.</th>
                            <th>Vencimiento Pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                <td>{order.supplier?.name}</td>
                                <td>{order.branch}</td>
                                <td>
                                    <span className={`status-badge ${(order.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                                        {order.status || 'Desconocido'}
                                    </span>
                                    {order.isPaid && <span className="status-badge paid">Pagado</span>}
                                </td>
                                <td>${(order.items || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0).toFixed(2)}</td>
                                <td>{order.paymentDueDate ? new Date(order.paymentDueDate).toLocaleDateString() : '-'}</td>
                                <td>
                                    <div className="action-buttons">
                                        {(order.status === 'Sin Enviar' || !order.status) && (
                                            <>
                                                <button className="icon-btn" title="Marcar Enviado" onClick={() => handleStatusAction(order.id, 'send')}>
                                                    <Truck size={16} />
                                                </button>
                                                <button className="icon-btn" title="Editar Pedido" onClick={() => handleEditOrder(order)}>
                                                    <Plus size={16} />
                                                </button>
                                                <button className="icon-btn delete-btn" title="Anular Pedido" onClick={() => handleDeleteOrder(order.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'Enviado' && (
                                            <button className="icon-btn success-btn" title="Recibir Pedido" onClick={() => handleStatusAction(order.id, 'receive')}>
                                                <Package size={16} />
                                            </button>
                                        )}
                                        {order.status === 'Ingresado' && !order.isPaid && (
                                            <button className="icon-btn" title="Marcar Pagado" onClick={() => handleStatusAction(order.id, 'pay')}>
                                                <DollarSign size={16} />
                                            </button>
                                        )}
                                        <button className="icon-btn" title="Ver Detalles" onClick={() => setViewModal({ show: true, order })}>
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center">No se encontraron pedidos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Order Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2>{isEditing ? `Editar Pedido #${currentEditId}` : 'Nuevo Pedido a Proveedor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="modal-form single-column-form">
                            <div className="modal-body">
                                <div className="form-group">
                                <label>Sucursal</label>
                                <select
                                    value={newOrder.branch}
                                    onChange={(e) => setNewOrder({ ...newOrder, branch: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="Sucursal Principal">Sucursal Principal</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="Tucuman">Tucumán</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Proveedor</label>
                                <select
                                    value={newOrder.supplierId}
                                    onChange={(e) => setNewOrder({ ...newOrder, supplierId: e.target.value })}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Seleccione un proveedor</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Método de Pago</label>
                                <select
                                    value={newOrder.paymentMethod}
                                    onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                                </select>
                            </div>

                            <div className="items-section">
                                <h3>Agregar Productos</h3>

                                {/* Search and Filters */}
                                <div className="form-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o SKU..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">Todas las Categorías</option>
                                            {categories.map(cat => {
                                                const catName = (typeof cat === 'object') ? (cat.name || cat.Name || '') : cat;
                                                return <option key={catName} value={catName}>{catName}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row items-input-row">
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label>Producto</label>
                                        <select
                                            value={newItem.productId}
                                            onChange={(e) => {
                                                const prod = filteredProducts.find(p => p.id === parseInt(e.target.value)) || products.find(p => p.id === parseInt(e.target.value));
                                                // Calculate cost based on supplier margin
                                                let cost = 0;
                                                if (prod) {
                                                    cost = prod.price;
                                                    const selectedSupplier = suppliers.find(s => s.id === parseInt(newOrder.supplierId));
                                                    if (selectedSupplier && selectedSupplier.marginPercentage) {
                                                        const margin = selectedSupplier.marginPercentage;
                                                        // Option B: Cost = Price * (1 - Margin/100)
                                                        cost = prod.price * (1 - (margin / 100));
                                                    }
                                                }

                                                setNewItem({
                                                    ...newItem,
                                                    productId: e.target.value,
                                                    unitPrice: parseFloat(cost.toFixed(2))
                                                });
                                            }}
                                            className="input-field"
                                            disabled={searchingProducts}
                                        >
                                            <option value="">
                                                {searchingProducts ? 'Buscando...' : 
                                                 (filteredProducts.length > 0 ? 'Seleccione un producto' : 'No hay productos que coincidan')}
                                            </option>
                                            {filteredProducts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Cantidad</label>
                                        <input
                                            type="number"
                                            placeholder="Cant."
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio Unit.</label>
                                        <input
                                            type="number"
                                            placeholder="Precio Unit."
                                            value={newItem.unitPrice}
                                            onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <button type="button" onClick={handleAddItem} className="btn btn-secondary">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <table className="data-table small-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>P. Venta</th>
                                            <th>Costo Est.</th>
                                            <th>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.productName}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.salePrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td>${item.unitPrice}</td>
                                                <td>${(item.quantity * item.unitPrice).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td>
                                                    <button type="button" className="icon-btn delete-btn" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Guardar Cambios' : 'Crear Pedido'}</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* View Details Modal */}
            {
                viewModal.show && viewModal.order && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '700px', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>Detalles del Pedido #{viewModal.order.id}</h2>
                                <button
                                    onClick={() => setViewModal({ show: false, order: null })}
                                    className="close-btn"
                                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body" style={{ padding: '2rem' }}>
                                <div className="order-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Proveedor</label>
                                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>{viewModal.order.supplier?.name || 'Desconocido'}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Fecha</label>
                                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>{viewModal.order.orderDate ? new Date(viewModal.order.orderDate).toLocaleString() : '-'}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Sucursal</label>
                                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>{viewModal.order.branch || 'Sucursal Principal'}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Estado</label>
                                        <div>
                                            <span className={`status-badge ${(viewModal.order.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                                                {viewModal.order.status || 'Desconocido'}
                                            </span>
                                        </div>
                                    </div>
                                    {viewModal.order.supplier?.contactInfo && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Contacto Proveedor</label>
                                            <div style={{ fontSize: '0.9rem', color: '#475569' }}>{viewModal.order.supplier.contactInfo}</div>
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Items del Pedido</h3>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Producto</th>
                                                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cant.</th>
                                                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Precio Unit.</th>
                                                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(viewModal.order.items || []).map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: idx < (viewModal.order.items?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                                        <div style={{ fontWeight: 500 }}>{item.product?.name || 'Producto'}</div>
                                                        {item.product?.sku && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SKU: {item.product.sku}</div>}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#475569' }}>${item.unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                                                        ${(item.quantity * item.unitPrice).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                                <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>Total Estimado:</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                                                    ${(viewModal.order.items || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
