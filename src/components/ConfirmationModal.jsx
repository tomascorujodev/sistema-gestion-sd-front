import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false, hideCancel = false }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content modal-content--confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header confirm-modal__header">
                    <div className="confirm-modal__heading">
                        <span className={`confirm-modal__icon${isDestructive ? ' confirm-modal__icon--danger' : ''}`}>
                            <AlertTriangle />
                        </span>
                        <div>
                            <h2 id="confirm-modal-title">{title}</h2>
                            <p className="confirm-modal__message">{message}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="close-btn" aria-label="Cerrar">
                        <X />
                    </button>
                </div>
                <div className="confirm-modal__body" />
                <div className="modal-footer">
                    {!hideCancel && (
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
