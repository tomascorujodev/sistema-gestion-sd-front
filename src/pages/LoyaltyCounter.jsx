import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Plus, Check, X, Printer, Gift, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoyaltyCustomerModal from '../components/LoyaltyCustomerModal';
import LoyaltyVoidModal from '../components/LoyaltyVoidModal';
import LoyaltyReceipt from '../components/LoyaltyReceipt';
import LoyaltyBranchSelect from '../components/LoyaltyBranchSelect';
import { useAuth } from '../context/AuthContext';
import useSucursalOperando from '../useSucursalOperando';
import {
    LOYALTY_API, TIPOS, puntos, conSigno, pesos, formatearDni, iniciales, fechaCorta,
    mensajeDeError, nuevaClave, sucursalCorta
} from '../loyalty';
import '../Loyalty.css';

const TABS = [
    { id: 'compra', label: 'Cargar compra' },
    { id: 'usar', label: 'Usar puntos' },
    { id: 'canjear', label: 'Canjear premio' },
    { id: 'entregar', label: 'Entregar canje' },
];

/**
 * Mostrador: buscar al cliente por DNI y cargarle una compra, un descuento con
 * puntos, un canje o la entrega de un canje de la tienda. Toda operación lleva
 * el número de ticket de la caja; los puntos los calcula la API.
 */
export default function LoyaltyCounter() {
    const { user } = useAuth();
    const { sucursal, propia: sucursalPropia, elegida, sucursales, elegir } = useSucursalOperando();

    const [dni, setDni] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [cliente, setCliente] = useState(null);
    const [noEncontrado, setNoEncontrado] = useState('');
    const [movimientos, setMovimientos] = useState([]);
    const [modalCliente, setModalCliente] = useState(null); // { customer?, initialDni? }

    const [tab, setTab] = useState('compra');
    const [form, setForm] = useState({});
    const [clave, setClave] = useState(nuevaClave);
    const [cotizacion, setCotizacion] = useState(null);
    const [premios, setPremios] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState(null);
    const [anular, setAnular] = useState(false);
    const dniRef = useRef(null);

    const cargarMovimientos = async (id) => {
        try {
            const { data } = await axios.get(`${LOYALTY_API}/movements`, { params: { customerId: id, pageSize: 6 } });
            setMovimientos(data.items);
        } catch {
            setMovimientos([]);
        }
    };

    const limpiarOperacion = () => {
        setForm({});
        setClave(nuevaClave());
        setCotizacion(null);
        setError('');
        setResultado(null);
    };

    const mostrarCliente = (c) => {
        setCliente(c);
        setNoEncontrado('');
        limpiarOperacion();
        cargarMovimientos(c.id);
    };

    const buscar = async (e) => {
        e?.preventDefault();
        const limpio = dni.replace(/\D/g, '');
        if (limpio.length < 7) return;
        setBuscando(true);
        setCliente(null);
        setNoEncontrado('');
        try {
            const { data } = await axios.get(`${LOYALTY_API}/customers/by-dni/${limpio}`);
            mostrarCliente(data);
        } catch (err) {
            if (err.response?.status === 404) setNoEncontrado(limpio);
            else setError(mensajeDeError(err, 'No se pudo buscar el cliente.'));
        } finally {
            setBuscando(false);
        }
    };

    const nuevaBusqueda = () => {
        setCliente(null);
        setNoEncontrado('');
        setDni('');
        limpiarOperacion();
        dniRef.current?.focus();
    };

    // Cotización de la compra mientras se tipea el monto.
    const monto = Number(form.monto);
    useEffect(() => {
        if (tab !== 'compra' || !(monto > 0)) { setCotizacion(null); return; }
        const t = setTimeout(() => {
            axios.get(`${LOYALTY_API}/quote`, { params: { amount: monto } })
                .then(({ data }) => setCotizacion(data))
                .catch(() => setCotizacion(null));
        }, 300);
        return () => clearTimeout(t);
    }, [tab, monto]);

    useEffect(() => {
        if (tab !== 'canjear' || !cliente) return;
        axios.get(`${LOYALTY_API}/rewards`).then(({ data }) => setPremios(data)).catch(() => setPremios([]));
    }, [tab, cliente]);

    const cambiarTab = (id) => {
        setTab(id);
        limpiarOperacion();
    };

    const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

    const confirmar = async (e) => {
        e.preventDefault();
        if (!sucursal) { setError('Elegí la sucursal en la que estás operando.'); return; }
        setEnviando(true);
        setError('');
        const base = { idempotencyKey: clave, ticketNumber: form.ticket, branch: sucursal };
        try {
            let op;
            if (tab === 'compra') {
                const { data } = await axios.post(`${LOYALTY_API}/purchases`, { ...base, customerId: cliente.id, amount: monto });
                op = { titulo: 'Compra registrada', movimiento: data.movement, points: data.movement.points, amount: data.movement.amount, balance: data.balance };
            } else if (tab === 'usar') {
                const { data } = await axios.post(`${LOYALTY_API}/discounts`, { ...base, customerId: cliente.id, points: Number(form.puntos) });
                op = { titulo: 'Descuento aplicado', movimiento: data.movement, points: data.movement.points, amount: data.movement.amount, balance: data.balance };
            } else if (tab === 'canjear') {
                const { data } = await axios.post(`${LOYALTY_API}/redemptions`, { ...base, customerId: cliente.id, rewardItemId: Number(form.premioId) });
                op = { titulo: 'Premio canjeado', points: -data.redemption.points, balance: data.balance, detalle: data.redemption.rewardName, ticketNumber: base.ticketNumber, redemptionId: data.redemption.id };
            } else {
                const { data } = await axios.post(`${LOYALTY_API}/redemptions/deliver`, { code: form.codigo, ticketNumber: form.ticket, branch: sucursal });
                op = { titulo: 'Canje entregado', points: 0, balance: data.balance, detalle: `${data.redemption.rewardName} · código ${data.redemption.code}`, ticketNumber: data.redemption.ticketNumber, entrega: true };
            }
            const m = op.movimiento;
            const final = {
                ...op,
                customer: cliente,
                ticketNumber: op.ticketNumber ?? m?.ticketNumber,
                branch: sucursal,
                createdAt: m?.createdAt ?? new Date().toISOString(),
                movementId: m?.id ?? op.movementId,
            };
            setResultado(final);
            setCliente({ ...cliente, pointsBalance: final.balance });
            cargarMovimientos(cliente.id);
        } catch (err) {
            setError(mensajeDeError(err));
        } finally {
            setEnviando(false);
        }
    };

    // Un canje se anula como canje (devuelve los puntos y repone el stock).
    const anularResultado = async (motivo) => {
        const { data } = resultado.redemptionId
            ? await axios.post(`${LOYALTY_API}/redemptions/${resultado.redemptionId}/cancel`, { reason: motivo })
            : await axios.post(`${LOYALTY_API}/movements/${resultado.movementId}/void`, { reason: motivo });
        setAnular(false);
        setCliente({ ...cliente, pointsBalance: data.balance });
        cargarMovimientos(cliente.id);
        limpiarOperacion();
    };

    const saldo = cliente?.pointsBalance ?? 0;
    const puntosAUsar = Number(form.puntos) || 0;
    const premioElegido = premios.find(p => String(p.id) === String(form.premioId));
    const puedeConfirmar = !!form.ticket && (
        (tab === 'compra' && cotizacion?.puntos > 0) ||
        (tab === 'usar' && puntosAUsar > 0 && puntosAUsar <= saldo) ||
        (tab === 'canjear' && premioElegido && premioElegido.pointsCost <= saldo) ||
        (tab === 'entregar' && !!form.codigo)
    );

    return (
        <div className="container loyalty">
            <PageHeader
                breadcrumb={[{ label: 'Fidelización' }, { label: 'Mostrador' }]}
                title="Mostrador"
                subtitle={sucursalPropia || undefined}
                actions={!sucursalPropia && <LoyaltyBranchSelect elegida={elegida} sucursales={sucursales} onChange={elegir} />}
            />

            <form className="card loyalty-search" onSubmit={buscar}>
                <div className="loyalty-search__field">
                    <label className="input-label" htmlFor="counter-dni">DNI del cliente</label>
                    <input
                        id="counter-dni"
                        ref={dniRef}
                        className="input-field"
                        inputMode="numeric"
                        autoComplete="off"
                        autoFocus
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={buscando || dni.replace(/\D/g, '').length < 7}>
                    <Search /> Buscar
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModalCliente({ initialDni: dni.replace(/\D/g, '') })}>
                    <Plus /> Nuevo cliente
                </button>
            </form>

            {!cliente && error && <div className="notice notice--danger" role="alert">{error}</div>}

            {noEncontrado && (
                <div className="card loyalty-panel">
                    <div className="notice notice--warning loyalty-notice">
                        <AlertTriangle />
                        <span>No hay ningún cliente con DNI {formatearDni(noEncontrado)}.</span>
                    </div>
                    <div className="loyalty-actions">
                        <button type="button" className="btn btn-secondary" onClick={nuevaBusqueda}>Buscar otro</button>
                        <button type="button" className="btn btn-primary" onClick={() => setModalCliente({ initialDni: noEncontrado })}>
                            <Plus /> Dar de alta
                        </button>
                    </div>
                </div>
            )}

            {cliente && (
                <div className="loyalty-columns">
                    <div className="loyalty-columns__main">
                        <div className="card loyalty-customer">
                            <span className="loyalty-avatar">{iniciales(cliente)}</span>
                            <div className="loyalty-customer__data">
                                <div className="loyalty-customer__name">
                                    <strong>{cliente.firstName} {cliente.lastName}</strong>
                                    {cliente.emailVerifiedAt && <span className="badge badge--success">Email verificado</span>}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalCliente({ customer: cliente })}>Editar</button>
                                </div>
                                <div className="loyalty-muted">
                                    {[`DNI ${formatearDni(cliente.dni)}`, cliente.email, cliente.phone].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            <div className="loyalty-balance">
                                <span className="loyalty-label">Saldo</span>
                                <span className="loyalty-balance__value">{puntos(saldo)} pts</span>
                            </div>
                        </div>

                        <div className="card loyalty-operation">
                            <div className="tabs-container loyalty-tabs" role="tablist">
                                {TABS.map(t => (
                                    <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                                        className={`tab-button${tab === t.id ? ' active' : ''}`} onClick={() => cambiarTab(t.id)}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {resultado ? (
                                <div className="loyalty-panel">
                                    <div className="loyalty-success">
                                        <span className="loyalty-success__icon"><Check /></span>
                                        <div>
                                            <strong>
                                                {resultado.titulo}
                                                {resultado.points !== 0 && `: ${conSigno(resultado.points)} puntos`}
                                            </strong>
                                            <div className="loyalty-muted">
                                                {[resultado.ticketNumber && `Ticket ${resultado.ticketNumber}`, resultado.detalle,
                                                    resultado.amount != null && tab === 'compra' && pesos(resultado.amount),
                                                    `Nuevo saldo: ${puntos(resultado.balance)} pts`].filter(Boolean).join(' · ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="loyalty-actions">
                                        {!resultado.entrega && (!resultado.redemptionId || user?.role === 'Admin') && (
                                            <button type="button" className="btn btn-ghost" onClick={() => setAnular(true)}><X /> Anular</button>
                                        )}
                                        <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer /> Imprimir comprobante</button>
                                        <button type="button" className="btn btn-primary" onClick={limpiarOperacion}><Plus /> Nueva operación</button>
                                    </div>
                                </div>
                            ) : (
                                <form className="loyalty-panel" onSubmit={confirmar}>
                                    {tab === 'canjear' && (
                                        <div className="loyalty-rewards">
                                            {premios.length === 0 && <div className="empty-state">No hay premios activos en el catálogo.</div>}
                                            {premios.map(p => {
                                                const sinStock = p.stock === 0;
                                                const falta = p.pointsCost - saldo;
                                                const deshabilitado = sinStock || falta > 0;
                                                return (
                                                    <button key={p.id} type="button" disabled={deshabilitado}
                                                        className={`loyalty-reward${String(form.premioId) === String(p.id) ? ' selected' : ''}`}
                                                        onClick={() => setForm({ ...form, premioId: p.id })}>
                                                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span className="loyalty-reward__img"><Gift /></span>}
                                                        <span className="loyalty-reward__name">{p.name}</span>
                                                        <span className="loyalty-reward__meta">
                                                            <strong>{puntos(p.pointsCost)} pts</strong>
                                                            <span>{sinStock ? 'Sin stock' : falta > 0 ? `Faltan ${puntos(falta)}` : p.stock == null ? 'Sin límite' : `Quedan ${p.stock}`}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="loyalty-fields">
                                        {tab === 'entregar' && (
                                            <div className="form-group">
                                                <label className="input-label" htmlFor="op-code">Código de retiro</label>
                                                <input id="op-code" className="input-field loyalty-code" value={form.codigo ?? ''} onChange={set('codigo')} maxLength={6} autoComplete="off" />
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label className="input-label" htmlFor="op-ticket">N.º de ticket</label>
                                            <input id="op-ticket" className="input-field" value={form.ticket ?? ''} onChange={set('ticket')} placeholder="0006-00000168" autoComplete="off" />
                                        </div>
                                        {tab === 'compra' && (
                                            <div className="form-group">
                                                <label className="input-label" htmlFor="op-amount">Monto de la compra</label>
                                                <input id="op-amount" className="input-field" type="number" min="0" step="0.01" inputMode="decimal" value={form.monto ?? ''} onChange={set('monto')} />
                                            </div>
                                        )}
                                        {tab === 'usar' && (
                                            <div className="form-group">
                                                <label className="input-label" htmlFor="op-points">Puntos a usar</label>
                                                <input id="op-points" className="input-field" type="number" min="1" max={saldo} step="1" value={form.puntos ?? ''} onChange={set('puntos')} />
                                            </div>
                                        )}
                                    </div>

                                    {tab === 'compra' && cotizacion && (
                                        <div className="loyalty-preview loyalty-preview--brand">
                                            <div>
                                                <span className="loyalty-label">Suma</span>
                                                <strong className="loyalty-preview__value">+{puntos(cotizacion.puntos)} puntos</strong>
                                            </div>
                                            <span className="loyalty-muted">
                                                {cotizacion.puntos > 0
                                                    ? `${cotizacion.porcentaje}% de ${pesos(monto)} · Saldo después: ${puntos(saldo + cotizacion.puntos)} pts`
                                                    : `La compra mínima es ${pesos(cotizacion.montoMinimo)}`}
                                            </span>
                                        </div>
                                    )}
                                    {tab === 'usar' && puntosAUsar > 0 && (
                                        <div className="loyalty-preview">
                                            <div>
                                                <span className="loyalty-label">Descuento en este ticket</span>
                                                <strong className="loyalty-preview__value">{pesos(puntosAUsar)}</strong>
                                            </div>
                                            <span className="loyalty-muted">
                                                {puntosAUsar > saldo ? 'No le alcanza el saldo' : `Saldo después: ${puntos(saldo - puntosAUsar)} pts`}
                                            </span>
                                        </div>
                                    )}

                                    {error && <div className="notice notice--danger" role="alert">{error}</div>}

                                    <div className="loyalty-actions">
                                        {tab === 'compra' && <button type="button" className="btn btn-secondary" onClick={limpiarOperacion}>Limpiar</button>}
                                        {tab === 'usar' && saldo > 0 && (
                                            <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, puntos: String(saldo) })}>
                                                Usar todo ({puntos(saldo)})
                                            </button>
                                        )}
                                        <button type="submit" className="btn btn-primary" disabled={enviando || !puedeConfirmar}>
                                            {tab === 'canjear' ? <Gift /> : <Check />}
                                            {{ compra: 'Confirmar compra', usar: 'Aplicar descuento', canjear: 'Canjear y entregar', entregar: 'Entregar' }[tab]}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <aside className="card loyalty-recent">
                        <div className="loyalty-recent__header">
                            <h2>Últimos movimientos</h2>
                            <Link to={`/fidelizacion/movimientos?customerId=${cliente.id}`}>Ver todos</Link>
                        </div>
                        {movimientos.length === 0 && <div className="empty-state">Sin movimientos todavía.</div>}
                        <ul>
                            {movimientos.map(m => (
                                <li key={m.id} className={m.isVoided ? 'voided' : undefined}>
                                    <div>
                                        <strong>{TIPOS[m.type]?.label ?? m.type}{m.branch && ` · ${sucursalCorta(m.branch)}`}</strong>
                                        <span className="loyalty-muted">
                                            {[fechaCorta(m.createdAt), m.ticketNumber && `ticket ${m.ticketNumber}`, m.customerOrderId && `pedido #${m.customerOrderId}`, m.reason]
                                                .filter(Boolean).join(' · ')}
                                        </span>
                                    </div>
                                    <span className={m.points >= 0 ? 'loyalty-plus' : 'loyalty-minus'}>{m.points === 0 ? '—' : conSigno(m.points)}</span>
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            )}

            <LoyaltyCustomerModal
                isOpen={!!modalCliente}
                customer={modalCliente?.customer}
                initialDni={modalCliente?.initialDni}
                onClose={() => setModalCliente(null)}
                onSaved={(c) => { setModalCliente(null); setDni(c.dni); mostrarCliente(c); }}
            />
            <LoyaltyVoidModal
                isOpen={anular}
                title="Anular operación"
                detail={resultado && `${cliente?.firstName} ${cliente?.lastName} · ${resultado.titulo}${resultado.ticketNumber ? ` · ticket ${resultado.ticketNumber}` : ''} · ${conSigno(resultado.points)} pts`}
                onClose={() => setAnular(false)}
                onConfirm={anularResultado}
            />
            <LoyaltyReceipt operation={resultado} />
        </div>
    );
}
