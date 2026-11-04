import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutList, Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { API_SECCIONES, mensajeError, textoDescuento } from '../storeSections';
import '../StoreBranches.css';

/**
 * Secciones de productos de la tienda (Página Web > Secciones): bloques del
 * inicio como "Destacados" o "Alimento BARF", cada uno con su página
 * /seccion/<slug>. El orden de esta lista es el orden en el inicio.
 */
export default function StoreSections() {
    const navigate = useNavigate();
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [borrar, setBorrar] = useState(null);

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        try {
            setCargando(true);
            const { data } = await axios.get(API_SECCIONES);
            setFilas(data);
            setError('');
        } catch {
            setError('Error al cargar las secciones');
        } finally {
            setCargando(false);
        }
    };

    const mover = async (indice, delta) => {
        const nuevas = [...filas];
        const destino = indice + delta;
        if (destino < 0 || destino >= nuevas.length) return;
        [nuevas[indice], nuevas[destino]] = [nuevas[destino], nuevas[indice]];
        setFilas(nuevas);
        try {
            await axios.put(`${API_SECCIONES}/order`, nuevas.map(f => f.section.id));
        } catch (err) {
            setError(mensajeError(err, 'Error al guardar el orden'));
            cargar();
        }
    };

    const confirmarBorrar = async () => {
        try {
            await axios.delete(`${API_SECCIONES}/${borrar.id}`);
            setBorrar(null);
            cargar();
        } catch {
            setBorrar(null);
            setError('Error al borrar la sección');
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1><LayoutList size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Secciones de la tienda</h1>
                <button className="btn btn-primary" onClick={() => navigate('/secciones-web/nueva')}>
                    <Plus size={16} /> <span style={{ marginLeft: '0.4rem' }}>Nueva sección</span>
                </button>
            </div>
            <p className="sb-intro">
                Bloques de productos del inicio de la tienda (&quot;Destacados&quot;, &quot;Alimento BARF&quot;…). Cada sección tiene su página con todos sus productos.
                Los productos se eligen a mano o por regla (especie, tipo, marca, ofertas). Si le cargás un descuento, el precio de sus productos baja en la web
                (no en el mostrador). Con las flechas cambiás el orden en el inicio. Sin secciones activas, el inicio muestra las ofertas como siempre.
            </p>

            <ConfirmationModal isOpen={!!borrar} onClose={() => setBorrar(null)} onConfirm={confirmarBorrar} title="Borrar sección"
                message={borrar ? `"${borrar.title}" deja de aparecer en la tienda y su página deja de existir. Los productos no se modifican.` : ''}
                confirmText="Borrar" isDestructive />

            {error && <div className="error-message" role="alert">{error}</div>}

            {cargando ? (
                <div className="loading-container">Cargando secciones...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5rem' }}>Orden</th>
                                <th>Sección</th>
                                <th>Productos</th>
                                <th>Descuento</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map(({ section: s, productCount, discountActive }, i) => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="sb-row-actions" style={{ justifyContent: 'flex-start' }}>
                                            <button className="icon-btn" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir" aria-label={`Subir ${s.title}`}><ArrowUp size={16} /></button>
                                            <button className="icon-btn" onClick={() => mover(i, 1)} disabled={i === filas.length - 1} title="Bajar" aria-label={`Bajar ${s.title}`}><ArrowDown size={16} /></button>
                                        </div>
                                    </td>
                                    <td>
                                        <Link to={`/secciones-web/${s.id}`}><strong>{s.title}</strong></Link>
                                        <div className="sb-sub">/seccion/{s.slug}</div>
                                    </td>
                                    <td>
                                        {productCount} {s.mode === 'regla' ? 'por regla' : 'elegidos'}
                                        <div className="sb-sub">{s.homeLimit > 0 ? `${s.homeLimit} en el inicio` : 'Solo su página'}</div>
                                    </td>
                                    <td>
                                        {textoDescuento(s) ?? '—'}
                                        {s.discountPercentage && <div className="sb-sub">{discountActive ? 'Vigente hoy' : 'No vigente hoy'}</div>}
                                    </td>
                                    <td>
                                        {s.isActive
                                            ? <span className="sb-badge sb-badge-on"><Eye size={13} /> Activa</span>
                                            : <span className="sb-badge"><EyeOff size={13} /> Oculta</span>}
                                    </td>
                                    <td>
                                        <div className="sb-row-actions">
                                            <button className="icon-btn edit-btn" onClick={() => navigate(`/secciones-web/${s.id}`)} title="Editar"><Edit size={16} /></button>
                                            <button className="icon-btn delete-btn" onClick={() => setBorrar(s)} title="Borrar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filas.length === 0 && (
                                <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>Todavía no hay secciones. Creá la primera con &quot;Nueva sección&quot;.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
