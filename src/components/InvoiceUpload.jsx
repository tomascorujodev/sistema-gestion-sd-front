import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function InvoiceUpload({ onSuccess, onAddShortage }) {
    // Initial state
    const initialState = {
        supplierId: '',
        invoiceNumber: '',
        entryDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        totalAmount: '',
        hasShortages: false
    };

    const [formData, setFormData] = useState(initialState);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/suppliers`);
            setSuppliers(response.data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            setError('Error al cargar proveedores');
        }
    };

    const handleSupplierChange = (e) => {
        const supplierId = e.target.value;
        const supplier = suppliers.find(s => s.id === parseInt(supplierId));

        let dueDate = formData.dueDate;
        if (supplier && formData.entryDate) {
            const entry = new Date(formData.entryDate);
            entry.setDate(entry.getDate() + (supplier.paymentDueDays || 0));
            dueDate = entry.toISOString().split('T')[0];
        }

        setFormData({
            ...formData,
            supplierId,
            dueDate
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                supplierId: parseInt(formData.supplierId),
                totalAmount: parseFloat(formData.totalAmount),
                paidAmount: 0,
                status: 'Pendiente',
                entryDate: new Date(formData.entryDate).toISOString(),
                dueDate: new Date(formData.dueDate).toISOString()
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/supplierinvoices`, payload);

            setLoading(false);
            setFormData(initialState); // Reset form

            if (payload.hasShortages && onAddShortage) {
                // Trigger shortage modal with the new invoice details
                onAddShortage(response.data);
            } else {
                // Only show success modal if NOT redirecting to shortages
                setSuccessModal(true);
            }

            if (onSuccess) onSuccess();

        } catch (err) {
            console.error('Error uploading invoice:', err);
            setError('Error al cargar la factura. Verifique los datos.');
            setLoading(false);
        }
    };

    return (
        <div className="invoice-upload-container" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <ConfirmationModal
                isOpen={successModal}
                onClose={() => setSuccessModal(false)}
                onConfirm={() => setSuccessModal(false)}
                title="Factura Cargada"
                message="La factura se ha guardado correctamente en el sistema."
                confirmText="Aceptar"
                isDestructive={false}
                hideCancel={true}
            />
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Carga de Facturas</h2>

            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="invoice-form responsive-form-grid">
                <div className="form-grid-container">
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Proveedor</label>
                        <select
                            value={formData.supplierId}
                            onChange={handleSupplierChange}
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Seleccione Proveedor</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Nro. Factura</label>
                        <input
                            type="text"
                            value={formData.invoiceNumber}
                            onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Fecha Ingreso</label>
                        <input
                            type="date"
                            value={formData.entryDate}
                            onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Fecha Vencimiento</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Importe Total</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.totalAmount}
                                onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                required
                                className="input-field"
                                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, color: '#334155' }}>
                        <input
                            type="checkbox"
                            checked={formData.hasShortages}
                            onChange={e => setFormData({ ...formData, hasShortages: e.target.checked })}
                            style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        Registrar Faltantes
                    </label>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                        Si marca esta opción, se abrirá el formulario de faltantes al guardar la factura.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar Factura'}
                    </button>
                </div>
            </form>
        </div>
    );
}
