import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css'; // Reuse styles



export default function EntitiesManagement() {
    const [activeTab, setActiveTab] = useState('Proveedores');

    return (
        <div className="container">
            <div className="page-header">
                <h1>Gestión de Entidades</h1>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                {['Proveedores', 'Rubros', 'Cuentas', 'Autorizantes'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--primary-color)' : '#64748b',
                            fontWeight: activeTab === tab ? 600 : 400,
                            background: 'none',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Proveedores' && <SuppliersTab />}
            {activeTab === 'Rubros' && <GenericEntityTab type="Category" title="Rubros" />}
            {activeTab === 'Cuentas' && <GenericEntityTab type="Account" title="Cuentas" />}
            {activeTab === 'Autorizantes' && <GenericEntityTab type="Authorizer" title="Autorizantes" />}
        </div>
    );
}

function SuppliersTab() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({ name: '', contactInfo: '', cuit: '', phone: '', paymentDueDays: 30, marginPercentage: 0 });
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/suppliers`);
            setSuppliers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar proveedores');
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingSupplier(null);
        setFormData({ name: '', contactInfo: '', cuit: '', phone: '', paymentDueDays: 30, marginPercentage: 0 });
        setIsModalOpen(true);
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contactInfo: supplier.contactInfo,
            cuit: supplier.cuit || '',
            phone: supplier.phone || '',
            paymentDueDays: supplier.paymentDueDays || 30,
            marginPercentage: supplier.marginPercentage || 0
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/suppliers/${editingSupplier.id}`, { ...formData, id: editingSupplier.id });
                setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...formData, id: editingSupplier.id } : s));
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/suppliers`, formData);
                setSuppliers([...suppliers, response.data]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert('Error al guardar proveedor');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/suppliers/${deleteModal.id}`);
            setSuppliers(suppliers.filter(s => s.id !== deleteModal.id));
            setDeleteModal({ show: false, id: null });
        } catch (err) {
            alert('Error al eliminar proveedor');
            setDeleteModal({ show: false, id: null });
        }
    };

    if (loading) return <div className="loading-container">Cargando proveedores...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div>
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Eliminar Proveedor"
                message="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                isDestructive={true}
            />
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleAdd}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Agregar Proveedor
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>CUIT</th>
                            <th>Teléfono</th>
                            <th>Días de Pago</th>
                            <th>Margen (%)</th>
                            <th>Información de Contacto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id}>
                                <td>{supplier.name}</td>
                                <td>{supplier.cuit || '-'}</td>
                                <td>{supplier.phone || '-'}</td>
                                <td>{supplier.paymentDueDays}</td>
                                <td>{supplier.marginPercentage}%</td>
                                <td>{supplier.contactInfo}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn edit-btn" onClick={() => handleEdit(supplier)}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteClick(supplier.id)}>
                                            <Trash2 size={16} />
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
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingSupplier ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>CUIT</label>
                                <input
                                    type="text"
                                    value={formData.cuit}
                                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Días a Pagar</label>
                                <input
                                    type="number"
                                    value={formData.paymentDueDays}
                                    onChange={(e) => setFormData({ ...formData, paymentDueDays: parseInt(e.target.value) || 0 })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Margen Proveedor (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.marginPercentage}
                                    onChange={(e) => setFormData({ ...formData, marginPercentage: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Información de Contacto (Extra)</label>
                                <input
                                    type="text"
                                    value={formData.contactInfo}
                                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function GenericEntityTab({ type, title }) {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    useEffect(() => {
        fetchEntities();
    }, [type]);

    const fetchEntities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/referenceentities`, {
                params: { type }
            });
            setEntities(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching entities:", err);
            setError('Error al cargar datos: ' + (err.response?.statusText || err.message));
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingEntity(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (entity) => {
        setEditingEntity(entity);
        setFormData({ name: entity.name });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingEntity) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/referenceentities/${editingEntity.id}`, {
                    ...editingEntity,
                    name: formData.name
                });
                setEntities(entities.map(e => e.id === editingEntity.id ? { ...e, name: formData.name } : e));
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/referenceentities`, {
                    name: formData.name,
                    type,
                    isActive: true
                });
                setEntities([...entities, response.data]);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error saving entity:", err);
            alert(`Error al guardar: ${err.response?.data?.title || err.message}`);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/referenceentities/${deleteModal.id}`);
            setEntities(entities.filter(e => e.id !== deleteModal.id));
            setDeleteModal({ show: false, id: null });
        } catch (err) {
            alert('Error al eliminar');
            setDeleteModal({ show: false, id: null });
        }
    };

    if (loading) return <div className="loading-container">Cargando...</div>;
    // if (error) return <div className="error-message">{error}</div>; // Keep simple

    return (
        <div>
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleConfirmDelete}
                title={`Eliminar ${title.slice(0, -1)}`} // Singularize vaguely
                message="¿Está seguro de que desea eliminar este elemento?"
                confirmText="Eliminar"
                isDestructive={true}
            />
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleAdd}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Agregar {title.slice(0, -1)}
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entities.map((entity) => (
                            <tr key={entity.id}>
                                <td>{entity.name}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn edit-btn" onClick={() => handleEdit(entity)}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteClick(entity.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {entities.length === 0 && (
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                                    No hay registros aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingEntity ? `Editar ${title.slice(0, -1)}` : `Agregar ${title.slice(0, -1)}`}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
