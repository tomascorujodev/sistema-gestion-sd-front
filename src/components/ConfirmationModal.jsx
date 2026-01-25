import { X, AlertTriangle } from 'lucide-react';
import '../ProductForm.css'; // Reuse modal styles

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false, hideCancel = false }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isDestructive && <AlertTriangle size={20} color="var(--error-text)" />}
                        {title}
                    </h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>
                        {message}
                    </p>
                </div>
                <div className="modal-footer">
                    {!hideCancel && (
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`btn ${isDestructive ? 'btn-destructive' : 'btn-primary'}`}
                        style={isDestructive ? { backgroundColor: 'var(--error-text)', color: 'white' } : {}}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
