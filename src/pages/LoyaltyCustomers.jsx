import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Plus, Edit, History } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import LoyaltyCustomerModal from '../components/LoyaltyCustomerModal';
import { LOYALTY_API, puntos, formatearDni } from '../loyalty';
import '../Loyalty.css';

function estadoEmail(c) {
    if (!c.email) return <span className="badge badge--danger">Sin email</span>;
    if (c.emailVerifiedAt) return <span className="badge badge--success">Verificado</span>;
    return <span className="badge badge--warning">Sin verificar</span>;
}

/** Clientes del programa de puntos. */
export default function LoyaltyCustomers() {
    const [busqueda, setBusqueda] = useState('');
    const [busquedaAplicada, setBusquedaAplicada] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [datos, setDatos] = useState({ items: [], totalCount: 0, totalPages: 0 });
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(null); // { customer? }

    useEffect(() => {
        const t = setTimeout(() => { setBusquedaAplicada(busqueda); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [busqueda]);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const { data } = await axios.get(`${LOYALTY_API}/customers`, { params: { search: busquedaAplicada || undefined, page, pageSize } });
            setDatos(data);
        } catch {
            setDatos({ items: [], totalCount: 0, totalPages: 0 });
        } finally {
            setCargando(false);
        }
    }, [busquedaAplicada, page, pageSize]);

    useEffect(() => { cargar(); }, [cargar]);

    // El listado no trae todos los datos: para editar se pide la ficha completa.
    const editar = async (id) => {
        const { data } = await axios.get(`${LOYALTY_API}/customers/${id}`);
        setModal({ customer: data });
    };

    return (
        <div className="container loyalty">
            <PageHeader
                breadcrumb={[{ label: 'Fidelización' }, { label: 'Clientes' }]}
                title="Clientes"
                subtitle={`${puntos(datos.totalCount)} ${busquedaAplicada ? 'encontrados' : 'clientes'}`}
                actions={<button className="btn btn-primary" onClick={() => setModal({})}><Plus /> Nuevo cliente</button>}
            />

            <div className="table-container">
                <div className="table-toolbar">
                    <div className="table-toolbar__group">
                        <div className="search-field loyalty-search-wide">
                            <Search />
                            <input className="input-field" placeholder="Buscar por nombre, DNI o email…" aria-label="Buscar cliente"
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                    </div>
                </div>
                <table className="data-table data-table--cards loyalty-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>DNI</th>
                            <th>Teléfono</th>
                            <th>Alta</th>
                            <th>Email</th>
                            <th>Puntos</th>
                            <th aria-label="Acciones"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.items.map(c => (
                            <tr key={c.id}>
                                <td className="cell-main">
                                    {c.firstName} {c.lastName}
                                    <div className="loyalty-muted">{c.email ?? 'Sin email'}</div>
                                </td>
                                <td data-label="DNI">{formatearDni(c.dni)}</td>
                                <td data-label="Teléfono" className="cell-meta">{c.phone ?? '—'}</td>
                                <td data-label="Alta" className="cell-meta">
                                    {new Date(c.createdAt).toLocaleDateString('es-AR', { month: '2-digit', year: 'numeric' })}
                                </td>
                                <td data-label="Email">{estadoEmail(c)}</td>
                                <td data-label="Puntos"><strong>{puntos(c.pointsBalance)}</strong></td>
                                <td className="cell-actions">
                                    <div className="action-buttons">
                                        <Link className="icon-btn" to={`/fidelizacion/movimientos?customerId=${c.id}`} title="Movimientos" aria-label={`Movimientos de ${c.firstName} ${c.lastName}`}>
                                            <History />
                                        </Link>
                                        <button className="icon-btn edit-btn" title="Editar" aria-label={`Editar ${c.firstName} ${c.lastName}`} onClick={() => editar(c.id)}>
                                            <Edit />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!cargando && datos.items.length === 0 && (
                            <tr><td colSpan="7" className="empty-state cell-empty">No se encontraron clientes.</td></tr>
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

            <LoyaltyCustomerModal
                isOpen={!!modal}
                customer={modal?.customer}
                onClose={() => setModal(null)}
                onSaved={() => { setModal(null); cargar(); }}
            />
        </div>
    );
}
