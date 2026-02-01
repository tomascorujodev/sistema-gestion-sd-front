import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AddShortageModal from '../components/AddShortageModal';

export default function Shortages() {
    const { user } = useAuth();
    const [shortages, setShortages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);

    // Status update handling
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    useEffect(() => {
        fetchShortages();
    }, [user]);

    const fetchShortages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shortages`);
            setShortages(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching shortages:', err);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este faltante? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/shortages/${id}`);
            setShortages(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting shortage:', err);
            alert(err.response?.data || 'Error al eliminar el faltante.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            setUpdatingStatusId(id);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/shortages/${id}/status`, JSON.stringify(newStatus), {
                headers: { 'Content-Type': 'application/json' }
            });
            // Update local state
            setShortages(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
            setUpdatingStatusId(null);
        } catch (err) {
            console.error('Error updating status:', err);
            setUpdatingStatusId(null);
            alert('Error al actualizar el estado.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendiente': return '#f59e0b';
            case 'Resuelto': return '#10b981';
            case 'Cancelado': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    // Filter logic
    const filteredShortages = shortages.filter(s =>
        s.missingProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.invoiceNumber.includes(searchTerm)
    );

    if (loading) return <div className="loading-container">Cargando faltantes...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h1>Faltantes de Mercadería</h1>
                    <p>Registro y seguimiento de productos faltantes</p>
                </div>
                {user?.role !== 'Admin' && (
                    <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} />
                        Registrar Faltante
                    </button>
                )}
            </div>

            <div className="filters-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por producto, proveedor o factura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                    <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Sucursal</th>
                            <th>Proveedor</th>
                            <th>Factura</th>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Nota</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShortages.length > 0 ? (
                            filteredShortages.map(item => (
                                <tr key={item.id}>
                                    <td>{formatDate(item.date)}</td>
                                    <td>{item.branch}</td>
                                    <td>{item.supplier?.name || '-'}</td>
                                    <td>{item.invoiceNumber}</td>
                                    <td style={{ fontWeight: 500 }}>{item.missingProduct}</td>
                                    <td>{item.quantity}</td>
                                    <td style={{ maxWidth: '200px', fontSize: '0.875rem', color: '#6b7280' }}>{item.note || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <select
                                                disabled={updatingStatusId === item.id}
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                style={{
                                                    padding: '0.15rem 0.25rem',
                                                    borderRadius: '0.25rem',
                                                    border: `1px solid ${getStatusColor(item.status)}`,
                                                    color: getStatusColor(item.status),
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    cursor: updatingStatusId === item.id ? 'wait' : 'pointer'
                                                }}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Resuelto">Resuelto</option>
                                                <option value="Cancelado">Cancelado</option>
                                            </select>
                                            {item.status === 'Resuelto' && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="icon-btn"
                                                    title="Eliminar faltante resuelto"
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No se encontraron registros de faltantes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddShortageModal
                isOpen={isaddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchShortages}
            />
        </div>
    );
}
