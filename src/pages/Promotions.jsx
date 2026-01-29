import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Tag, ChevronLeft, ChevronRight, List, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../Products.css';

export default function Promotions() {
    const { user } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
    const [editingPromo, setEditingPromo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [newPromo, setNewPromo] = useState({
        description: '',
        validUntil: '',
        paymentMethods: '',
        discountPercentage: '',
        refundCap: '',
        installments: '',
        promotionDays: '',
        collectionMethod: '',
        discountResponsible: ''
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/promotions`);
            setPromotions(response.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newPromo,
                discountPercentage: parseFloat(newPromo.discountPercentage),
                refundCap: newPromo.refundCap ? parseFloat(newPromo.refundCap) : null,
                installments: newPromo.installments ? parseInt(newPromo.installments) : null
            };

            if (editingPromo) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/promotions/${editingPromo.id}`, { ...payload, id: editingPromo.id });
                setPromotions(promotions.map(p => p.id === editingPromo.id ? { ...payload, id: editingPromo.id } : p));
                alert('Promoción actualizada correctamente');
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/promotions`, payload);
                setPromotions([...promotions, response.data]);
                alert('Promoción creada correctamente');
            }

            resetForm();
            setViewMode('list');
        } catch (err) {
            console.error(err);
            alert(`Error al ${editingPromo ? 'actualizar' : 'crear'} la promoción`);
        }
    };

    const resetForm = () => {
        setNewPromo({
            description: '',
            validUntil: '',
            paymentMethods: '',
            discountPercentage: '',
            refundCap: '',
            installments: '',
            promotionDays: '',
            collectionMethod: '',
            discountResponsible: ''
        });
        setEditingPromo(null);
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        setNewPromo({
            description: promo.description,
            validUntil: promo.validUntil.split('T')[0], // Extract only the date part
            paymentMethods: promo.paymentMethods,
            discountPercentage: promo.discountPercentage,
            refundCap: promo.refundCap || '',
            installments: promo.installments || '',
            promotionDays: promo.promotionDays,
            collectionMethod: promo.collectionMethod,
            discountResponsible: promo.discountResponsible
        });
        setViewMode('create');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar esta promoción?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/promotions/${id}`);
            setPromotions(promotions.filter(p => p.id !== id));
        } catch (err) {
            alert('Error al eliminar la promoción');
        }
    };

    if (loading) return <div className="loading-container">Cargando promociones...</div>;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromotions = promotions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(promotions.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container">
            <div className="page-header">
                <h1>{viewMode === 'list' ? 'Promociones Activas' : (editingPromo ? 'Editar Promoción' : 'Nueva Promoción')}</h1>
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
                                Nueva Promoción
                            </>
                        ) : (
                            <>
                                <List size={16} style={{ marginRight: '0.5rem' }} />
                                Ver Promociones Activas
                            </>
                        )}
                    </button>
                )}
            </div>

            {viewMode === 'create' && user?.role === 'Admin' ? (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Descripción</label>
                            <input
                                type="text"
                                value={newPromo.description}
                                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Ej: 2x1 en Alimento para Perros"
                            />
                        </div>

                        <div>
                            <label className="input-label">Medios de Pago</label>
                            <input
                                type="text"
                                value={newPromo.paymentMethods}
                                onChange={(e) => setNewPromo({ ...newPromo, paymentMethods: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Ej: Visa, Mastercard, Efectivo"
                            />
                        </div>

                        <div>
                            <label className="input-label">Porcentaje de Descuento (%)</label>
                            <input
                                type="number"
                                value={newPromo.discountPercentage}
                                onChange={(e) => setNewPromo({ ...newPromo, discountPercentage: e.target.value })}
                                required
                                className="input-field"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="input-label">Tope de Reintegro (Opcional)</label>
                            <input
                                type="number"
                                value={newPromo.refundCap}
                                onChange={(e) => setNewPromo({ ...newPromo, refundCap: e.target.value })}
                                className="input-field"
                                placeholder="Dejar vacío si no tiene tope"
                            />
                        </div>

                        <div>
                            <label className="input-label">Cuotas (Opcional)</label>
                            <input
                                type="number"
                                value={newPromo.installments}
                                onChange={(e) => setNewPromo({ ...newPromo, installments: e.target.value })}
                                className="input-field"
                                placeholder="Dejar vacío si no tiene cuotas"
                            />
                        </div>

                        <div>
                            <label className="input-label">Días de Promoción</label>
                            <input
                                type="text"
                                value={newPromo.promotionDays}
                                onChange={(e) => setNewPromo({ ...newPromo, promotionDays: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Ej: Lunes y Miércoles"
                            />
                        </div>

                        <div>
                            <label className="input-label">Vigencia Hasta</label>
                            <input
                                type="date"
                                value={newPromo.validUntil}
                                onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })}
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Medio de Cobro</label>
                            <input
                                type="text"
                                value={newPromo.collectionMethod}
                                onChange={(e) => setNewPromo({ ...newPromo, collectionMethod: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Ej: Posnet, QR, Efectivo"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Responsable del Descuento</label>
                            <textarea
                                value={newPromo.discountResponsible}
                                onChange={(e) => setNewPromo({ ...newPromo, discountResponsible: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Explique quién aplica el descuento (Banco, Comercio, etc.)"
                                rows="2"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingPromo ? <Save size={16} style={{ marginRight: '0.5rem' }} /> : <Plus size={16} style={{ marginRight: '0.5rem' }} />}
                                {editingPromo ? 'Guardar Cambios' : 'Agregar Promoción'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {currentPromotions.map((promo) => (
                            <div key={promo.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid var(--primary-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <Tag size={20} className="text-primary" />
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{promo.description}</h3>
                                    </div>
                                    {user?.role === 'Admin' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="icon-btn edit-btn" onClick={() => handleEdit(promo)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => handleDelete(promo.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                                    <p><strong>Descuento:</strong> {promo.discountPercentage}%</p>
                                    <p><strong>Medios de Pago:</strong> {promo.paymentMethods}</p>
                                    <p><strong>Tope de Reintegro:</strong> {promo.refundCap ? `$${promo.refundCap}` : 'Sin tope'}</p>
                                    <p><strong>Cuotas:</strong> {promo.installments ? promo.installments : 'Sin cuotas'}</p>
                                    <p><strong>Días:</strong> {promo.promotionDays}</p>
                                    <p><strong>Vigencia:</strong> {new Date(promo.validUntil).toLocaleDateString()}</p>
                                    <p><strong>Medio de Cobro:</strong> {promo.collectionMethod}</p>
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0 }}><strong>Responsable:</strong></p>
                                        <p style={{ margin: 0 }}>{promo.discountResponsible}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {promotions.length === 0 && <p className="text-center" style={{ gridColumn: '1/-1' }}>No hay promociones activas.</p>}
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
