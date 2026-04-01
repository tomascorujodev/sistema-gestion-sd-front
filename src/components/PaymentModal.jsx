import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Plus, Trash2 } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }) {
    const [paymentLines, setPaymentLines] = useState([]);
    const [globalNotes, setGlobalNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && invoice) {
            const max = invoice.totalAmount - invoice.paidAmount;
            setPaymentLines([{ id: Date.now(), amount: max.toString(), paymentMethod: 'Efectivo', auto: false }]);
            setGlobalNotes('');
        }
    }, [isOpen, invoice]);

    if (!isOpen || !invoice) return null;

    const maxAmount = invoice.totalAmount - invoice.paidAmount;
    const ccPercent = invoice.supplier?.cashCreditNotePercentage || 0;

    const handleAddLine = () => {
        setPaymentLines([...paymentLines, { id: Date.now(), amount: '', paymentMethod: 'Efectivo', auto: false }]);
    };

    const handleRemoveLine = (id) => {
        setPaymentLines(paymentLines.filter(l => l.id !== id));
    };

    const handleLineChange = (id, field, value) => {
        setPaymentLines(prev => prev.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                if (field === 'paymentMethod') {
                    if (value === 'Nota de crédito contado') {
                        updated.amount = (invoice.totalAmount * ccPercent / 100).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        updated.auto = true;
                    } else {
                        updated.auto = false;
                        updated.amount = ''; // reset amount so user types it
                    }
                }
                return updated;
            }
            return line;
        }));
    };

    const sumLines = paymentLines.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (sumLines <= 0) {
            alert('Debe ingresar al menos un monto de pago mayor a 0 en las líneas de pago.');
            return;
        }

        if (sumLines > maxAmount + 0.01) {
            alert('La suma de los pagos no puede superar el saldo pendiente general de la factura.');
            return;
        }

        setLoading(true);

        try {
            const payload = paymentLines.map(l => ({
                amount: parseFloat(l.amount),
                paymentMethod: l.paymentMethod,
                notes: globalNotes
            }));

            await axios.post(`${import.meta.env.VITE_API_URL}/api/supplierinvoices/${invoice.id}/payments/batch`, payload);
            
            setLoading(false);
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
            <div className="modal-content" style={{ maxWidth: '750px' }}>
                <div className="modal-header">
                    <h2>Registrar Pago - Factura #{invoice.invoiceNumber}</h2>
                    <button onClick={onClose} className="close-btn">X</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="modal-body">
                        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Total Factura:</span>
                                <span style={{ fontWeight: 600 }}>${invoice.totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b' }}>Pagado Histórico:</span>
                                <span style={{ fontWeight: 600, color: '#10b981' }}>${invoice.paidAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>Saldo Pendiente General:</span>
                                <span style={{ fontWeight: 700, color: '#f59e0b' }}>${maxAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0' }}>Líneas de Pago</h4>
                            {paymentLines.map((line, index) => (
                                <div key={line.id} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 3 }}>
                                        <select
                                            value={line.paymentMethod}
                                            onChange={e => handleLineChange(line.id, 'paymentMethod', e.target.value)}
                                            className="input-field"
                                            style={{ margin: 0, fontSize: '1.05rem', padding: '0.75rem' }}
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Transferencia">Transferencia</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Cuenta Corriente">Cuenta Corriente</option>
                                            <option value="Nota de crédito contado">Nota de crédito contado ({ccPercent}%)</option>
                                            <option value="Nota de crédito">Nota de crédito (Manual)</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 2, position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }}>$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.amount}
                                            onChange={e => handleLineChange(line.id, 'amount', e.target.value)}
                                            required
                                            disabled={line.auto}
                                            className="input-field"
                                            style={{ paddingLeft: '2rem', margin: 0, backgroundColor: line.auto ? '#f1f5f9' : '#fff', fontSize: '1.2rem', fontWeight: 'bold', padding: '0.75rem 0.75rem 0.75rem 2rem' }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {paymentLines.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveLine(line.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.75rem' }}
                                            title="Eliminar línea"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button 
                                type="button" 
                                className="btn btn-sm btn-secondary" 
                                onClick={handleAddLine}
                                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                                <Plus size={16} /> Agregar Medio de Pago
                            </button>
                        </div>

                        {sumLines > 0 && (
                            <div style={{ background: sumLines === maxAmount ? '#d1fae5' : '#f8fafc', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid', borderColor: sumLines === maxAmount ? '#10b981' : '#cbd5e1', fontSize: '1.05rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Suma a Abonar Hoy:</span>
                                    <strong>${sumLines.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: sumLines === maxAmount ? '#10b981' : '#ea580c' }}>
                                    <span>Saldo que quedará pendiente de la factura:</span>
                                    <span><strong>${Math.max(0, maxAmount - sumLines).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></span>
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Notas Globales (Opcional)</label>
                            <textarea
                                value={globalNotes}
                                onChange={e => setGlobalNotes(e.target.value)}
                                className="input-field"
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading || sumLines <= 0 || sumLines > maxAmount + 0.01}
                            style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Pagos'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
