import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddShortageModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        invoiceNumber: '',
        missingProduct: '',
        quantity: 1,
        note: '',
        branch: '' // For Admins
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            // Reset form or use initialData
            if (initialData) {
                setFormData({
                    date: initialData.entryDate ? new Date(initialData.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    supplierId: initialData.supplierId || '',
                    invoiceNumber: initialData.invoiceNumber || '',
                    missingProduct: '',
                    quantity: 1,
                    note: '',
                    branch: ''
                });
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    supplierId: '',
                    invoiceNumber: '',
                    missingProduct: '',
                    quantity: 1,
                    note: '',
                    branch: ''
                });
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/suppliers`);
            setSuppliers(response.data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            setError('Error al cargar proveedores.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.supplierId) {
            setError('Seleccione un proveedor.');
            setLoading(false);
            return;
        }

        if (user.role === 'Admin' && !formData.branch) {
            setError('Seleccione una sucursal.');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/shortages`, {
                ...formData,
                supplierId: parseInt(formData.supplierId),
                quantity: parseInt(formData.quantity)
            });
            setLoading(false);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating shortage:', err);
            setError(err.response?.data || 'Error al guardar el faltante.');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Registrar Faltante</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Fecha</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>

                        {user?.role === 'Admin' && (
                            <div className="form-group">
                                <label>Sucursal</label>
                                <select
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Seleccione Sucursal</option>
                                    <option value="Tucuman">Tucumán</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="Sucursal Principal">Sucursal Principal</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Proveedor</label>
                            <select
                                name="supplierId"
                                value={formData.supplierId}
                                onChange={handleChange}
                                required
                                className="input-field"
                            >
                                <option value="">Seleccione un proveedor...</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Nº Factura</label>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={handleChange}
                                placeholder="Ej: 0001-12345678"
                                required
                                className="input-field"
                            />
                        </div>

                        <div className="form-group">
                            <label>Producto Faltante</label>
                            <input
                                type="text"
                                name="missingProduct"
                                value={formData.missingProduct}
                                onChange={handleChange}
                                placeholder="Nombre del producto"
                                required
                                className="input-field"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cantidad</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                required
                                className="input-field"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nota (Opcional)</label>
                            <textarea
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Detalles adicionales..."
                                className="input-field"
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save size={18} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
