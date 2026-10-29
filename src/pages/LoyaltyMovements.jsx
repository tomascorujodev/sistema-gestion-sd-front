import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import LoyaltyVoidModal from '../components/LoyaltyVoidModal';
import { useAuth } from '../context/AuthContext';
import {
    LOYALTY_API, TIPOS, ANULABLES, puntos, conSigno, pesos, formatearDni, fechaCorta, diaLocal, sucursalCorta
} from '../loyalty';
import '../Loyalty.css';

const PERIODOS = [
    { id: 'hoy', label: 'Hoy', desde: () => diaLocal(0) },
    { id: '7', label: 'Últimos 7 días', desde: () => diaLocal(-6) },
    { id: '30', label: 'Últimos 30 días', desde: () => diaLocal(-29) },
    { id: 'todo', label: 'Todo', desde: () => undefined },
];

/** Todos los movimientos de puntos: quién cargó qué, con qué ticket y en qué sucursal. */
export default function LoyaltyMovements() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [params] = useSearchParams();
    const customerId = params.get('customerId');

    const [busqueda, setBusqueda] = useState('');
    const [busquedaAplicada, setBusquedaAplicada] = useState('');
    const [tipo, setTipo] = useState('');
    const [sucursal, setSucursal] = useState('');
    const [periodo, setPeriodo] = useState(customerId ? 'todo' : 'hoy');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [datos, setDatos] = useState({ items: [], totalCount: 0, totalPages: 0 });
    const [resumen, setResumen] = useState(null);
    const [sucursales, setSucursales] = useState([]);
    const [anular, setAnular] = useState(null);
    const [recarga, setRecarga] = useState(0);

    // Buscar al dejar de tipear.
    useEffect(() => {
        const t = setTimeout(() => { setBusquedaAplicada(busqueda); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [busqueda]);

    useEffect(() => {
        if (!isAdmin) return;
        axios.get(`${import.meta.env.VITE_API_URL}/api/store-branches`).then(({ data }) => setSucursales(data)).catch(() => { });
    }, [isAdmin]);

    useEffect(() => {
        let vigente = true;
        const desde = PERIODOS.find(p => p.id === periodo).desde();
        axios.get(`${LOYALTY_API}/movements`, {
            params: { customerId: customerId || undefined, search: busquedaAplicada || undefined, type: tipo || undefined, branch: sucursal || undefined, from: desde, page, pageSize }
        }).then(({ data }) => {
            if (vigente) setDatos(data);
        }).catch(() => {
            if (vigente) setDatos({ items: [], totalCount: 0, totalPages: 0 });
        });
        // Una respuesta vieja (filtros ya cambiados) no pisa la nueva.
        return () => { vigente = false; };
    }, [customerId, busquedaAplicada, tipo, sucursal, periodo, page, pageSize, recarga]);

    // El resumen va aparte: si falla, la tabla igual se muestra (y al revés).
    useEffect(() => {
        let vigente = true;
        axios.get(`${LOYALTY_API}/movements/summary`, { params: { branch: sucursal || undefined } })
            .then(({ data }) => { if (vigente) setResumen(data); })
            .catch(() => { if (vigente) setResumen(null); });
        return () => { vigente = false; };
    }, [sucursal, recarga]);

    // Sin resumen (cargando o con error) las tarjetas quedan con "—": la estructura no cambia.
    const r = resumen;

    const filtro = (setter) => (e) => { setter(e.target.value); setPage(1); };

    const confirmarAnulacion = async (motivo) => {
        await axios.post(`${LOYALTY_API}/movements/${anular.id}/void`, { reason: motivo });
        setAnular(null);
        setRecarga(n => n + 1);
    };

    return (
        <div className="container loyalty">
            <PageHeader breadcrumb={[{ label: 'Fidelización' }, { label: 'Movimientos' }]} title="Movimientos" />

            <div className="loyalty-stats">
                <div className="card loyalty-stat">
                    <span className="loyalty-label">Puntos otorgados hoy</span>
                    <strong className="loyalty-plus">{r ? `+${puntos(r.pointsGiven)}` : '—'}</strong>
                    <span className="loyalty-muted">{r ? `${r.purchases} compras · ${pesos(r.purchasesAmount)}` : 'Sin datos'}</span>
                </div>
                <div className="card loyalty-stat">
                    <span className="loyalty-label">Puntos usados hoy</span>
                    <strong className="loyalty-minus">{r ? `−${puntos(r.pointsUsed)}` : '—'}</strong>
                    <span className="loyalty-muted">{r ? `${r.discounts} descuentos · ${r.redemptions} canjes` : 'Sin datos'}</span>
                </div>
                <div className="card loyalty-stat">
                    <span className="loyalty-label">Anulaciones hoy</span>
                    <strong className={r?.voids ? 'loyalty-warn' : undefined}>{r ? r.voids : '—'}</strong>
                    <span className="loyalty-muted">{!r ? 'Sin datos' : r.voids ? 'Revisar motivo' : 'Ninguna'}</span>
                </div>
            </div>

            <div className="table-container">
                <div className="table-toolbar">
                    <div className="table-toolbar__group loyalty-filters">
                        <div className="search-field">
                            <Search />
                            <input className="input-field" placeholder="Buscar por cliente, DNI o ticket…" aria-label="Buscar"
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                        <select className="form-select" value={tipo} onChange={filtro(setTipo)} aria-label="Tipo">
                            <option value="">Todos los tipos</option>
                            {Object.entries(TIPOS).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
                        </select>
                        {isAdmin && (
                            <select className="form-select" value={sucursal} onChange={filtro(setSucursal)} aria-label="Sucursal">
                                <option value="">Todas las sucursales</option>
                                {sucursales.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                            </select>
                        )}
                        <select className="form-select" value={periodo} onChange={filtro(setPeriodo)} aria-label="Período">
                            {PERIODOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                </div>
                <table className="data-table data-table--cards loyalty-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Ticket</th>
                            <th>Sucursal · cargó</th>
                            <th>Monto</th>
                            <th>Puntos</th>
                            <th aria-label="Acciones"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.items.map(m => (
                            <tr key={m.id} className={m.isVoided ? 'voided' : undefined}>
                                <td data-label="Fecha" className="cell-meta">{fechaCorta(m.createdAt)}</td>
                                <td className="cell-main">
                                    {m.customerName}
                                    <div className="loyalty-muted">DNI {formatearDni(m.customerDni)}</div>
                                </td>
                                <td data-label="Tipo">
                                    <span className={`badge badge--${m.isVoided ? 'danger' : TIPOS[m.type]?.badge ?? 'info'}`}>
                                        {m.isVoided ? 'Anulada' : TIPOS[m.type]?.label ?? m.type}
                                    </span>
                                </td>
                                <td data-label="Ticket">{m.ticketNumber ?? (m.customerOrderId ? `Pedido #${m.customerOrderId}` : '—')}</td>
                                <td data-label="Sucursal">
                                    {sucursalCorta(m.branch)}
                                    <div className="loyalty-muted">{m.username ?? 'sistema'}</div>
                                </td>
                                <td data-label="Monto" className="cell-meta" title={m.reason ?? undefined}>{m.amount != null ? pesos(m.amount) : '—'}</td>
                                <td data-label="Puntos" className={m.points >= 0 ? 'loyalty-plus' : 'loyalty-minus'}>{m.points === 0 ? '—' : conSigno(m.points)}</td>
                                <td className="cell-actions">
                                    {!m.isVoided && ANULABLES.includes(m.type) && (
                                        <button className="icon-btn delete-btn" title="Anular" aria-label={`Anular movimiento de ${m.customerName}`} onClick={() => setAnular(m)}>
                                            <X />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {datos.items.length === 0 && (
                            <tr><td colSpan="8" className="empty-state cell-empty">No hay movimientos con estos filtros.</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    totalPages={datos.totalPages}
                    totalRecords={datos.totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                />
            </div>

            <LoyaltyVoidModal
                isOpen={!!anular}
                title={`Anular ${TIPOS[anular?.type]?.label.toLowerCase() ?? 'movimiento'}`}
                detail={anular && `${anular.customerName} · DNI ${formatearDni(anular.customerDni)}${anular.ticketNumber ? ` · ticket ${anular.ticketNumber}` : ''} · ${conSigno(anular.points)} pts`}
                onClose={() => setAnular(null)}
                onConfirm={confirmarAnulacion}
            />
        </div>
    );
}
