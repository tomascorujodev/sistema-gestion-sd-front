import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { mensajeDeError } from '../loyalty';

/**
 * Anular un movimiento o un canje: pide el motivo (obligatorio) y muestra el
 * error de la API si no se puede (por ejemplo, el cliente ya usó los puntos).
 */
export default function LoyaltyVoidModal({ isOpen, ...props }) {
    // Se monta al abrir: cada apertura arranca con el formulario vacío.
    return isOpen ? <Modal {...props} /> : null;
}

function Modal({ title, detail, warning, confirmText = 'Anular', onClose, onConfirm }) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const confirmar = async (e) => {
        e.preventDefault();
        if (!motivo.trim()) return;
        setEnviando(true);
        setError('');
        try {
            await onConfirm(motivo.trim());
        } catch (err) {
            setError(mensajeDeError(err));
            setEnviando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form
                className="modal-content modal-content--confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="void-modal-title"
                onClick={(e) => e.stopPropagation()}
                onSubmit={confirmar}
            >
                <div className="modal-header confirm-modal__header">
                    <div className="confirm-modal__heading">
                        <span className="confirm-modal__icon confirm-modal__icon--danger"><AlertTriangle /></span>
                        <h2 id="void-modal-title">{title}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="close-btn" aria-label="Cerrar"><X /></button>
                </div>
                <div className="modal-body">
                    {detail && <div className="loyalty-detail">{detail}</div>}
                    {warning && <p className="loyalty-muted">{warning}</p>}
                    <div className="form-group">
                        <label className="input-label" htmlFor="void-reason">Motivo</label>
                        <input
                            id="void-reason"
                            className="input-field"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            maxLength={255}
                            required
                            autoFocus
                        />
                    </div>
                    {error && <div className="notice notice--danger" role="alert">{error}</div>}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" className="btn btn-danger" disabled={enviando || !motivo.trim()}>{confirmText}</button>
                </div>
            </form>
        </div>
    );
}
