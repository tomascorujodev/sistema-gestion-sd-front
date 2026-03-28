import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddShortageModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [generalData, setGeneralData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        invoiceNumber: '',
        branch: '' // For Admins
    });
    const [items, setItems] = useState([
        { missingProduct: '', quantity: 1, note: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            if (initialData) {
                setGeneralData({
                    date: initialData.entryDate ? new Date(initialData.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    supplierId: initialData.supplierId || '',
                    invoiceNumber: initialData.invoiceNumber || '',
                    branch: ''
                });
            } else {
                setGeneralData({
                    date: new Date().toISOString().split('T')[0],
                    supplierId: '',
                    invoiceNumber: '',
                    branch: ''
                });
            }
            setItems([{ missingProduct: '', quantity: 1, note: '' }]);
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

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        setGeneralData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { missingProduct: '', quantity: 1, note: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!generalData.supplierId) {
            setError('Seleccione un proveedor.');
            setLoading(false);
            return;
        }

        if (user.role === 'Admin' && !generalData.branch) {
            setError('Seleccione una sucursal.');
            setLoading(false);
            return;
        }

        // Validate items
        const hasEmptyProduct = items.some(item => !item.missingProduct.trim());
        if (hasEmptyProduct) {
            setError('Todos los productos deben tener un nombre.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...generalData,
                supplierId: parseInt(generalData.supplierId),
                items: items.map(item => ({
                    ...item,
                    quantity: parseInt(item.quantity)
                }))
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/shortages/bulk`, payload);
            setLoading(false);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating shortages:', err);
            setError(err.response?.data || 'Error al guardar los faltantes.');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <h2>Registrar Faltantes</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form single-column-form">
                    <div className="modal-body">
                        {error && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={generalData.date}
                                    onChange={handleGeneralChange}
                                    required
                                    className="input-field"
                                />
                            </div>

                            {user?.role === 'Admin' && (
                                <div className="form-group">
                                    <label>Sucursal</label>
                                    <select
                                        name="branch"
                                        value={generalData.branch}
                                        onChange={handleGeneralChange}
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
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Proveedor</label>
                                <select
                                    name="supplierId"
                                    value={generalData.supplierId}
                                    onChange={handleGeneralChange}
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
                                    value={generalData.invoiceNumber}
                                    onChange={handleGeneralChange}
                                    placeholder="Ej: 0001-12345678"
                                    required
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Productos Faltantes</h3>
                                <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                                    + Agregar Producto
                                </button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', position: 'relative' }}>
                                    {items.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeItem(index)} 
                                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer' }}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Producto</label>
                                            <input
                                                type="text"
                                                value={item.missingProduct}
                                                onChange={(e) => handleItemChange(index, 'missingProduct', e.target.value)}
                                                placeholder="Nombre del producto"
                                                required
                                                className="input-field"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Cantidad</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                min="1"
                                                required
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Nota (Opcional)</label>
                                        <input
                                            type="text"
                                            value={item.note || ''}
                                            onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                                            placeholder="Detalles adicionales..."
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            ))}
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
                                    Guardar Todo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
