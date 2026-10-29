import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Edit, Search, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { LOYALTY_API, puntos, conSigno, formatearDni, mensajeDeError, nuevaClave } from '../loyalty';
import '../Loyalty.css';

/** Reglas del programa de puntos y ajuste manual de saldo. Solo Admin. */
export default function LoyaltySettings() {
    const [reglas, setReglas] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [ajuste, setAjuste] = useState(false);

    useEffect(() => {
        axios.get(`${LOYALTY_API}/settings`).then(({ data }) => setReglas(data)).catch(() => setMensaje({ tipo: 'danger', texto: 'No se pudieron cargar las reglas.' }));
    }, []);

    const guardar = async (e) => {
        e.preventDefault();
        setMensaje(null);
        try {
            const { data } = await axios.put(`${LOYALTY_API}/settings`, {
                basePercentage: Number(reglas.basePercentage),
                minPurchaseAmount: Number(reglas.minPurchaseAmount),
            });
            setReglas(data);
            setMensaje({ tipo: 'success', texto: 'Guardado. Aplica a las compras que se carguen desde ahora.' });
        } catch (err) {
            setMensaje({ tipo: 'danger', texto: mensajeDeError(err, 'No se pudo guardar.') });
        }
    };

    return (
        <div className="container loyalty">
            <PageHeader breadcrumb={[{ label: 'Fidelización' }, { label: 'Configuración' }]} title="Configuración" />

            {reglas && (
                <form className="card loyalty-panel" onSubmit={guardar}>
                    <h2 className="loyalty-card-title">Cómo se suman los puntos</h2>
                    <div className="loyalty-fields">
                        <div className="form-group">
                            <label className="input-label" htmlFor="cfg-pct">% de la compra en puntos</label>
                            <input id="cfg-pct" className="input-field" type="number" min="0.01" max="100" step="0.01" required
                                value={reglas.basePercentage} onChange={(e) => setReglas({ ...reglas, basePercentage: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="input-label" htmlFor="cfg-min">Compra mínima ($)</label>
                            <input id="cfg-min" className="input-field" type="number" min="0" step="1" required
                                value={reglas.minPurchaseAmount} onChange={(e) => setReglas({ ...reglas, minPurchaseAmount: e.target.value })} />
                        </div>
                    </div>
                    {mensaje && <div className={`notice notice--${mensaje.tipo}`} role="status">{mensaje.texto}</div>}
                    <div className="loyalty-actions">
                        <button type="submit" className="btn btn-primary"><Check /> Guardar cambios</button>
                    </div>
                </form>
            )}

            <div className="card loyalty-row-card">
                <h2 className="loyalty-card-title">Ajuste manual de saldo</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setAjuste(true)}><Edit /> Hacer un ajuste</button>
            </div>

            {ajuste && <AjusteModal onClose={() => setAjuste(false)} />}
        </div>
    );
}

function AjusteModal({ onClose }) {
    const [dni, setDni] = useState('');
    const [cliente, setCliente] = useState(null);
    const [puntosAjuste, setPuntosAjuste] = useState('');
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [listo, setListo] = useState(null);
    const [clave] = useState(nuevaClave);

    const buscar = async () => {
        setError('');
        setCliente(null);
        try {
            const { data } = await axios.get(`${LOYALTY_API}/customers/by-dni/${dni.replace(/\D/g, '')}`);
            setCliente(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'No hay ningún cliente con ese DNI.' : mensajeDeError(err));
        }
    };

    const confirmar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await axios.post(`${LOYALTY_API}/adjustments`, {
                customerId: cliente.id, points: Number(puntosAjuste), reason: motivo, idempotencyKey: clave,
            });
            setListo(data);
        } catch (err) {
            setError(mensajeDeError(err));
        }
    };

    const n = Number(puntosAjuste) || 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-content" role="dialog" aria-modal="true" aria-labelledby="adj-title" onClick={(e) => e.stopPropagation()} onSubmit={confirmar}>
                <div className="modal-header">
                    <h2 id="adj-title">Ajuste manual de saldo</h2>
                    <button type="button" onClick={onClose} className="close-btn" aria-label="Cerrar"><X /></button>
                </div>
                <div className="modal-body">
                    {listo ? (
                        <div className="notice notice--success">
                            Ajuste registrado: {conSigno(listo.movement.points)} pts. Nuevo saldo de {cliente.firstName}: {puntos(listo.balance)} pts.
                        </div>
                    ) : (
                        <>
                            <div className="loyalty-inline">
                                <div className="form-group">
                                    <label className="input-label" htmlFor="adj-dni">DNI del cliente</label>
                                    <input id="adj-dni" className="input-field" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} autoFocus />
                                </div>
                                <button type="button" className="btn btn-secondary" onClick={buscar} disabled={dni.replace(/\D/g, '').length < 7}><Search /> Buscar</button>
                            </div>
                            {cliente && (
                                <>
                                    <div className="loyalty-detail">
                                        {cliente.firstName} {cliente.lastName} · DNI {formatearDni(cliente.dni)} · saldo {puntos(cliente.pointsBalance)} pts
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label" htmlFor="adj-points">Puntos (negativo para restar)</label>
                                        <input id="adj-points" className="input-field" type="number" step="1" value={puntosAjuste} onChange={(e) => setPuntosAjuste(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label" htmlFor="adj-reason">Motivo</label>
                                        <input id="adj-reason" className="input-field" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} required />
                                    </div>
                                    {n !== 0 && <p className="loyalty-muted">Saldo después: {puntos(cliente.pointsBalance + n)} pts</p>}
                                </>
                            )}
                            {error && <div className="notice notice--danger" role="alert">{error}</div>}
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{listo ? 'Cerrar' : 'Cancelar'}</button>
                    {!listo && <button type="submit" className="btn btn-primary" disabled={!cliente || n === 0 || !motivo.trim()}>Registrar ajuste</button>}
                </div>
            </form>
        </div>
    );
}
