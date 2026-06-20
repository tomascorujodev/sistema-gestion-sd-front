import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Save, X, CalendarClock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import '../FoodExpirations.css';

const API = `${import.meta.env.VITE_API_URL}/api/foodexpirations`;

const emptyForm = { productName: '', expirationDate: '', quantity: '', lotNotes: '', branch: '' };

// Estado segun fecha de vencimiento vs hoy.
function getStatus(expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp - today) / 86400000);

    if (diffDays < 0) return { key: 'expired', label: 'Vencido', days: diffDays };
    if (diffDays <= 7) return { key: 'soon', label: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays}d`, days: diffDays };
    return { key: 'ok', label: 'Vigente', days: diffDays };
}

export default function FoodExpirations() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState(''); // solo admin
    const [branches, setBranches] = useState([]);          // solo admin

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    useEffect(() => {
        fetchItems();
        if (isAdmin) fetchBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchFilter]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const params = isAdmin && branchFilter ? { branch: branchFilter } : {};
            const res = await axios.get(API, { params });
            setItems(res.data);
            setError('');
        } catch (err) {
            setError('Error al cargar los vencimientos');
        } finally {
            setLoading(false);
        }
    };

    // Lista de sucursales para el selector del admin (derivada de usuarios).
    const fetchBranches = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
            const list = [...new Set((res.data || []).map(u => u.branch).filter(Boolean))].sort();
            setBranches(list);
        } catch (err) {
            // si falla, el admin igual puede tipear la sucursal manualmente
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isAdmin && !form.branch.trim()) {
            alert('Seleccioná una sucursal');
            return;
        }
        const payload = {
            productName: form.productName.trim(),
            expirationDate: form.expirationDate,
            quantity: form.quantity ? parseInt(form.quantity) : null,
            lotNotes: form.lotNotes.trim() || null,
            branch: isAdmin ? form.branch.trim() : (user?.branch || '')
        };
        try {
            if (editingId) {
                await axios.put(`${API}/${editingId}`, { ...payload, id: editingId });
            } else {
                await axios.post(API, payload);
            }
            resetForm();
            fetchItems();
        } catch (err) {
            alert(`Error al ${editingId ? 'actualizar' : 'agregar'} el vencimiento`);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            productName: item.productName,
            expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
            quantity: item.quantity ?? '',
            lotNotes: item.lotNotes || '',
            branch: item.branch || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API}/${deleteModal.id}`);
            setDeleteModal({ show: false, id: null });
            fetchItems();
        } catch (err) {
            alert('Error al eliminar el vencimiento');
        }
    };

    // Filtro por nombre en cliente. Backend ya devuelve ordenado por fecha asc.
    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(i => i.productName.toLowerCase().includes(q));
    }, [items, search]);

    return (
        <div className="container">
            <div className="page-header">
                <h1>Vencimientos de Alimentos</h1>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Eliminar Vencimiento"
                message="¿Está seguro de eliminar este registro de vencimiento?"
                confirmText="Eliminar"
                isDestructive={true}
            />

            {/* Alta / edicion rapida */}
            <form className="ve-quickform" onSubmit={handleSubmit}>
                <div className="ve-field ve-field-grow">
                    <label className="input-label">Producto</label>
                    <input
                        type="text"
                        className="input-field"
                        value={form.productName}
                        onChange={(e) => setForm({ ...form, productName: e.target.value })}
                        placeholder="Ej: Alimento perro adulto 15kg"
                        required
                    />
                </div>
                <div className="ve-field">
                    <label className="input-label">Vencimiento</label>
                    <input
                        type="date"
                        className="input-field"
                        value={form.expirationDate}
                        onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                        required
                    />
                </div>
                <div className="ve-field ve-field-sm">
                    <label className="input-label">Cantidad</label>
                    <input
                        type="number"
                        min="0"
                        className="input-field"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        placeholder="Opc."
                    />
                </div>
                <div className="ve-field">
                    <label className="input-label">Lote / Notas</label>
                    <input
                        type="text"
                        className="input-field"
                        value={form.lotNotes}
                        onChange={(e) => setForm({ ...form, lotNotes: e.target.value })}
                        placeholder="Opcional"
                    />
                </div>
                {isAdmin && (
                    <div className="ve-field">
                        <label className="input-label">Sucursal</label>
                        {branches.length > 0 ? (
                            <select
                                className="input-field"
                                value={form.branch}
                                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="input-field"
                                value={form.branch}
                                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                placeholder="Sucursal"
                                required
                            />
                        )}
                    </div>
                )}
                <div className="ve-actions">
                    <button type="submit" className="btn btn-primary">
                        {editingId ? <Save size={16} /> : <Plus size={16} />}
                        <span style={{ marginLeft: '0.4rem' }}>{editingId ? 'Guardar' : 'Agregar'}</span>
                    </button>
                    {editingId && (
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            </form>

            {/* Filtros */}
            <div className="ve-toolbar">
                <div className="ve-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {isAdmin && (
                    <select
                        className="input-field ve-branch-filter"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                        <option value="">Todas las sucursales</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="loading-container">Cargando vencimientos...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Producto</th>
                                <th>Vencimiento</th>
                                <th>Cantidad</th>
                                <th>Lote / Notas</th>
                                {isAdmin && <th>Sucursal</th>}
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleItems.map(item => {
                                const st = getStatus(item.expirationDate);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <span className={`ve-badge ve-badge-${st.key}`}>
                                                <CalendarClock size={13} />
                                                {st.label}
                                            </span>
                                        </td>
                                        <td>{item.productName}</td>
                                        <td>{new Date(item.expirationDate).toLocaleDateString()}</td>
                                        <td>{item.quantity ?? '—'}</td>
                                        <td>{item.lotNotes || '—'}</td>
                                        {isAdmin && <td>{item.branch}</td>}
                                        <td>
                                            <div className="ve-row-actions">
                                                <button className="icon-btn edit-btn" onClick={() => handleEdit(item)} title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="icon-btn delete-btn" onClick={() => setDeleteModal({ show: true, id: item.id })} title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {visibleItems.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6} className="text-center" style={{ padding: '2rem' }}>
                                        No hay vencimientos cargados.
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
