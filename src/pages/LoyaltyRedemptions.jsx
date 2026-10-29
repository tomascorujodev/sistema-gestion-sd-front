import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import LoyaltyVoidModal from '../components/LoyaltyVoidModal';
import LoyaltyBranchSelect from '../components/LoyaltyBranchSelect';
import { useAuth } from '../context/AuthContext';
import useSucursalOperando from '../useSucursalOperando';
import { LOYALTY_API, puntos, formatearDni, fechaCorta, mensajeDeError, sucursalCorta } from '../loyalty';
import '../Loyalty.css';

const ESTADOS = ['Pendiente', 'Entregado', 'Anulado'];
const TITULOS = { Pendiente: 'Pendientes', Entregado: 'Entregados', Anulado: 'Anulados' };

/**
 * Canjes pedidos desde la tienda. Se entregan solo con el código que el
 * cliente ve en "Mi cuenta": por eso el panel no muestra el código de los
 * pendientes (si el empleado lo viera, dejaría de probar que el cliente es el
 * dueño de la cuenta).
 */
export default function LoyaltyRedemptions() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const { sucursal, propia, elegida, sucursales, elegir } = useSucursalOperando();
    const [estado, setEstado] = useState('Pendiente');
    const [conteos, setConteos] = useState({});
    const [page, setPage] = useState(1);
    const [datos, setDatos] = useState({ items: [], totalCount: 0, totalPages: 0 });
    const [entrega, setEntrega] = useState({ codigo: '', ticket: '' });
    const [mensaje, setMensaje] = useState(null); // { tipo, texto }
    const [enviando, setEnviando] = useState(false);
    const [anular, setAnular] = useState(null);
    const pageSize = 20;

    const cargar = useCallback(async () => {
        try {
            const [lista, ...totales] = await Promise.all([
                axios.get(`${LOYALTY_API}/redemptions`, { params: { status: estado, page, pageSize } }),
                ...ESTADOS.map(s => axios.get(`${LOYALTY_API}/redemptions`, { params: { status: s, pageSize: 1 } })),
            ]);
            setDatos(lista.data);
            setConteos(Object.fromEntries(ESTADOS.map((s, i) => [s, totales[i].data.totalCount])));
        } catch {
            setDatos({ items: [], totalCount: 0, totalPages: 0 });
        }
    }, [estado, page]);

    useEffect(() => { cargar(); }, [cargar]);

    const entregar = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setMensaje(null);
        try {
            const { data } = await axios.post(`${LOYALTY_API}/redemptions/deliver`, { code: entrega.codigo, ticketNumber: entrega.ticket, branch: sucursal });
            setMensaje({ tipo: 'success', texto: `Entregado: ${data.redemption.rewardName} · código ${data.redemption.code}` });
            setEntrega({ codigo: '', ticket: '' });
            cargar();
        } catch (err) {
            setMensaje({ tipo: 'danger', texto: mensajeDeError(err) });
        } finally {
            setEnviando(false);
        }
    };

    const confirmarAnulacion = async (motivo) => {
        await axios.post(`${LOYALTY_API}/redemptions/${anular.id}/cancel`, { reason: motivo });
        setAnular(null);
        cargar();
    };

    return (
        <div className="container loyalty">
            <PageHeader
                breadcrumb={[{ label: 'Fidelización' }, { label: 'Canjes' }]}
                title="Canjes"
                actions={!propia && <LoyaltyBranchSelect elegida={elegida} sucursales={sucursales} onChange={elegir} />}
            />

            <form className="card loyalty-deliver" onSubmit={entregar}>
                <h2>Entregar canje</h2>
                <div className="form-group">
                    <label className="input-label" htmlFor="deliver-code">Código de retiro</label>
                    <input id="deliver-code" className="input-field loyalty-code" maxLength={6} autoComplete="off"
                        value={entrega.codigo} onChange={(e) => setEntrega({ ...entrega, codigo: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="input-label" htmlFor="deliver-ticket">N.º de ticket</label>
                    <input id="deliver-ticket" className="input-field" placeholder="0006-00000168" autoComplete="off"
                        value={entrega.ticket} onChange={(e) => setEntrega({ ...entrega, ticket: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={enviando || !entrega.codigo || !entrega.ticket}>
                    <Check /> Entregar
                </button>
            </form>
            {mensaje && <div className={`notice notice--${mensaje.tipo}`} role="status">{mensaje.texto}</div>}

            <div className="tabs-container" role="tablist">
                {ESTADOS.map(s => (
                    <button key={s} type="button" role="tab" aria-selected={estado === s}
                        className={`tab-button${estado === s ? ' active' : ''}`}
                        onClick={() => { setEstado(s); setPage(1); }}>
                        {TITULOS[s]}
                        {s === 'Pendiente' && conteos[s] > 0 && <span className="tab-count">{conteos[s]}</span>}
                    </button>
                ))}
            </div>

            <div className="table-container">
                <table className="data-table data-table--cards loyalty-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Premio</th>
                            <th>Puntos</th>
                            {estado === 'Entregado' && <><th>Entrega</th><th>Ticket</th></>}
                            {estado === 'Anulado' && <th>Motivo</th>}
                            <th aria-label="Acciones"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.items.map(r => (
                            <tr key={r.id}>
                                <td data-label="Pedido" className="cell-meta">{fechaCorta(r.createdAt)}</td>
                                <td className="cell-main">
                                    {r.customerName}
                                    <div className="loyalty-muted">DNI {formatearDni(r.customerDni)}</div>
                                </td>
                                <td data-label="Premio">{r.rewardName}</td>
                                <td data-label="Puntos" className="loyalty-brand">{puntos(r.points)} pts</td>
                                {estado === 'Entregado' && (
                                    <>
                                        <td data-label="Entrega" className="cell-meta">{sucursalCorta(r.branch)} · {fechaCorta(r.deliveredAt)}</td>
                                        <td data-label="Ticket">{r.ticketNumber ?? '—'}</td>
                                    </>
                                )}
                                {estado === 'Anulado' && <td data-label="Motivo" className="cell-meta">{r.cancelReason}</td>}
                                <td className="cell-actions">
                                    {(estado === 'Pendiente' || (estado === 'Entregado' && isAdmin)) && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => setAnular(r)}><X /> Anular</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {datos.items.length === 0 && (
                            <tr><td colSpan="7" className="empty-state cell-empty">No hay canjes {TITULOS[estado].toLowerCase()}.</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination page={page} totalPages={datos.totalPages} totalRecords={datos.totalCount} pageSize={pageSize} onPageChange={setPage} />
            </div>

            <LoyaltyVoidModal
                isOpen={!!anular}
                title="Anular canje"
                detail={anular && `${anular.customerName} · ${anular.rewardName} · ${puntos(anular.points)} pts`}
                warning="Se le devuelven los puntos y el premio vuelve al stock."
                onClose={() => setAnular(null)}
                onConfirm={confirmarAnulacion}
            />
        </div>
    );
}
