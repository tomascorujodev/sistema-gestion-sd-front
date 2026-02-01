import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Tag, ChevronLeft, ChevronRight, List, Edit, Save, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css';

export default function Coupons() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountPercentage: '',
        validFrom: '',
        validUntil: '',
        category: '', // Empty string means "All"
        isActive: true
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        hideCancel: false
    });

    useEffect(() => {
        fetchCoupons();
        fetchCategories();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/coupons`);
            setCoupons(response.data);
            if (user?.role !== 'Admin') {
                setCoupons(response.data.filter(c => c.isActive));
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/store/categories`);
            setCategories(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const showModal = (title, message, onConfirm, isDestructive = false, hideCancel = false) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDestructive,
            hideCancel
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newCoupon,
                discountPercentage: parseFloat(newCoupon.discountPercentage),
                category: newCoupon.category === '' ? null : newCoupon.category
            };

            if (editingCoupon) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/coupons/${editingCoupon.id}`, { ...payload, id: editingCoupon.id });
                setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...payload, id: editingCoupon.id } : c));
                showModal('Éxito', 'Cupón actualizado correctamente', () => { }, false, true);
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons`, payload);
                setCoupons([...coupons, response.data]);
                showModal('Éxito', 'Cupón creado correctamente', () => { }, false, true);
            }

            resetForm();
            setViewMode('list');
        } catch (err) {
            console.error(err);
            showModal('Error', `Error al ${editingCoupon ? 'actualizar' : 'crear'} el cupón. El código debe ser único.`, () => { }, true, true);
        }
    };

    const resetForm = () => {
        setNewCoupon({
            code: '',
            discountPercentage: '',
            validFrom: '',
            validUntil: '',
            category: '',
            isActive: true
        });
        setEditingCoupon(null);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setNewCoupon({
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            validFrom: coupon.validFrom.split('T')[0],
            validUntil: coupon.validUntil.split('T')[0],
            category: coupon.category || '',
            isActive: coupon.isActive
        });
        setViewMode('create');
    };

    const handleDelete = (id) => {
        showModal(
            'Eliminar Cupón',
            '¿Está seguro de eliminar este cupón? Esta acción no se puede deshacer.',
            async () => {
                try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/coupons/${id}`);
                    setCoupons(coupons.filter(c => c.id !== id));
                    // Optional: Show success modal after deletion if desired, or just refresh list
                } catch (err) {
                    showModal('Error', 'Error al eliminar el cupón.', () => { }, true, true);
                }
            },
            true
        );
    };

    if (loading) return <div className="loading-container">Cargando cupones...</div>;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCoupons = coupons.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(coupons.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDestructive={modalConfig.isDestructive}
                hideCancel={modalConfig.hideCancel}
                confirmText={modalConfig.hideCancel ? "Entendido" : "Confirmar"}
            />

            <div className="page-header">
                <h1>{viewMode === 'list' ? 'Gestión de Cupones' : (editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón')}</h1>
                {user?.role === 'Admin' && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (viewMode === 'list') {
                                resetForm();
                                setViewMode('create');
                            } else {
                                setViewMode('list');
                                resetForm();
                            }
                        }}
                    >
                        {viewMode === 'list' ? (
                            <>
                                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                                Nuevo Cupón
                            </>
                        ) : (
                            <>
                                <List size={16} style={{ marginRight: '0.5rem' }} />
                                Ver Cupones
                            </>
                        )}
                    </button>
                )}
            </div>

            {viewMode === 'create' && user?.role === 'Admin' ? (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="input-label">Código</label>
                            <input
                                type="text"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                required
                                className="input-field"
                                placeholder="Ej: VERANO2026"
                            />
                        </div>

                        <div>
                            <label className="input-label">Porcentaje de Descuento (%)</label>
                            <input
                                type="number"
                                value={newCoupon.discountPercentage}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discountPercentage: e.target.value })}
                                required
                                className="input-field"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="input-label">Válido Desde</label>
                            <input
                                type="date"
                                value={newCoupon.validFrom}
                                onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Válido Hasta</label>
                            <input
                                type="date"
                                value={newCoupon.validUntil}
                                onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Categoría (Opcional)</label>
                            <select
                                value={newCoupon.category}
                                onChange={(e) => setNewCoupon({ ...newCoupon, category: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <small style={{ color: '#6b7280' }}>Si se selecciona, el descuento solo aplica a productos de esta categoría.</small>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <label className="input-label" style={{ marginRight: '1rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={newCoupon.isActive}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, isActive: e.target.checked })}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Activo
                            </label>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingCoupon ? <Save size={16} style={{ marginRight: '0.5rem' }} /> : <Plus size={16} style={{ marginRight: '0.5rem' }} />}
                                {editingCoupon ? 'Guardar Cambios' : 'Crear Cupón'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {currentCoupons.map((coupon) => (
                            <div key={coupon.id} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                borderLeft: `4px solid ${coupon.isActive ? 'var(--primary-color)' : '#9ca3af'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{coupon.code}</h3>
                                    {user?.role === 'Admin' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="icon-btn edit-btn" onClick={() => handleEdit(coupon)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => handleDelete(coupon.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                                    <p><strong>Descuento:</strong> {coupon.discountPercentage}%</p>
                                    <p><strong>Categoría:</strong> {coupon.category || 'Todas'}</p>
                                    <p><strong>Válido:</strong> {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <strong>Estado:</strong>
                                        {coupon.isActive ? (
                                            <span style={{ display: 'flex', alignItems: 'center', color: 'green', gap: '0.25rem' }}>
                                                <Check size={16} /> Activo
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', color: 'gray', gap: '0.25rem' }}>
                                                <X size={16} /> Inactivo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {coupons.length === 0 && <p className="text-center" style={{ gridColumn: '1/-1' }}>No hay cupones registrados.</p>}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
