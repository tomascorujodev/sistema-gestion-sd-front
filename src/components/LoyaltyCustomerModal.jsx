import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { LOYALTY_API, mensajeDeError } from '../loyalty';
import { useAuth } from '../context/AuthContext';

const vacio = { dni: '', firstName: '', lastName: '', email: '', phone: '', birthDate: '', gender: '', customerType: '', address: '' };

/** Alta y edición de un cliente del programa de puntos. El saldo no se toca acá. */
export default function LoyaltyCustomerModal({ isOpen, ...props }) {
    // Se monta al abrir: el formulario arranca con los datos del cliente elegido.
    return isOpen ? <Modal {...props} /> : null;
}

function Modal({ customer, initialDni = '', onClose, onSaved }) {
    const { user } = useAuth();
    const [form, setForm] = useState(() => customer
        ? Object.fromEntries(Object.keys(vacio).map(k => [k, customer[k] ?? '']))
        : { ...vacio, dni: initialDni });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const editando = !!customer?.id;

    const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

    const guardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setError('');
        const datos = { ...form, birthDate: form.birthDate || null };
        try {
            const { data } = editando
                ? await axios.put(`${LOYALTY_API}/customers/${customer.id}`, datos)
                : await axios.post(`${LOYALTY_API}/customers`, datos);
            onSaved(data);
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo guardar el cliente.'));
            setGuardando(false);
        }
    };

    const campo = (nombre, etiqueta, props = {}) => (
        <div className="form-group">
            <label className="input-label" htmlFor={`lc-${nombre}`}>{etiqueta}</label>
            <input id={`lc-${nombre}`} className="input-field" value={form[nombre]} onChange={set(nombre)} {...props} />
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form
                className="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="customer-modal-title"
                onClick={(e) => e.stopPropagation()}
                onSubmit={guardar}
            >
                <div className="modal-header">
                    <h2 id="customer-modal-title">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                    <button type="button" onClick={onClose} className="close-btn" aria-label="Cerrar"><X /></button>
                </div>
                <div className="modal-body loyalty-form-grid">
                    {campo('dni', 'DNI', { required: true, inputMode: 'numeric', autoFocus: !editando, disabled: editando && user?.role !== 'Admin' })}
                    {campo('firstName', 'Nombre', { required: true, maxLength: 100, autoFocus: editando })}
                    {campo('lastName', 'Apellido', { required: true, maxLength: 100 })}
                    {campo('phone', 'Teléfono (opcional)', { maxLength: 30, inputMode: 'tel' })}
                    {campo('email', 'Email (opcional)', { type: 'email', maxLength: 255 })}
                    {campo('birthDate', 'Fecha de nacimiento (opcional)', { type: 'date' })}
                    {error && <div className="notice notice--danger loyalty-form-grid__full" role="alert">{error}</div>}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                        {editando ? 'Guardar' : 'Dar de alta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
