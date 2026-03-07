import { useState } from 'react';
import axios from 'axios';
import { DollarSign } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !invoice) return null;

    const maxAmount = invoice.totalAmount - invoice.paidAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation handles by input max on type number but nice to double check
        if (parseFloat(amount) > maxAmount) {
            alert('El monto no puede superar el saldo pendiente.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                amount: parseFloat(amount),
                paymentMethod,
                notes
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/supplierinvoices/${invoice.id}/payments`, payload);
            setLoading(false);
            setAmount('');
            setNotes('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al registrar el pago');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Registrar Pago - Factura #{invoice.invoiceNumber}</h2>
                    <button onClick={onClose} className="close-btn">X</button>
                </div>

                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Total Factura:</span>
                        <span style={{ fontWeight: 600 }}>${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Pagado:</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>${invoice.paidAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Saldo Pendiente:</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>${maxAmount.toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Monto a Pagar</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                            <input
                                type="number"
                                step="0.01"
                                max={maxAmount}
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                                className="input-field"
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem' }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Método de Pago</label>
                        <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="input-field"
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Cuenta Corriente">Cuenta Corriente</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notas (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="input-field"
                            rows="2"
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
