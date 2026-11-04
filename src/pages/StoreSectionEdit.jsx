import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LayoutList, Save, ArrowUp, ArrowDown, X, Plus, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { API_SECCIONES, mensajeError } from '../storeSections';
import '../StoreBranches.css';

const API_CATALOGO = `${import.meta.env.VITE_API_URL}/api/product-attributes`;
const MAX_MANUAL = 48;
const POR_PAGINA = 30;

// Valores de la API (Utils/Taxonomia.cs). "servicio" no se muestra en la tienda: no se ofrece.
const ESPECIES = { perro: 'Perro', gato: 'Gato', ambos: 'Ambos', otros: 'Otros' };
const TIPOS = {
    'alimento-seco': 'Alimento seco', 'alimento-humedo': 'Alimento húmedo', snacks: 'Snacks',
    sanitarios: 'Sanitarios', accesorios: 'Accesorios', salud: 'Salud', otros: 'Otros',
};
const ALIMENTOS = 'alimentos'; // filtro del buscador: seco + húmedo

const vacia = {
    title: '', subtitle: '', isActive: true, homeLimit: 4, mode: 'manual',
    ruleSpecies: '', ruleType: '', ruleBrand: '', ruleOnlyOffers: false,
    discountPercentage: '', discountFrom: '', discountUntil: '', discountAllowsCoupons: false,
};

const pesos = (n) => n == null ? '—' : n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });

/** Lo que se manda a la API: vacíos como null, números como números. */
const cuerpo = (f) => {
    const texto = (v) => (v ?? '').trim() || null;
    const regla = f.mode === 'regla';
    const pct = f.discountPercentage === '' || f.discountPercentage == null ? null : Number(f.discountPercentage);
    return {
        title: f.title.trim(),
        subtitle: texto(f.subtitle),
        isActive: f.isActive,
        homeLimit: Number(f.homeLimit) || 0,
        mode: f.mode,
        ruleSpecies: regla ? texto(f.ruleSpecies) : null,
        ruleType: regla ? texto(f.ruleType) : null,
        ruleBrand: regla ? texto(f.ruleBrand) : null,
        ruleOnlyOffers: regla && f.ruleOnlyOffers,
        discountPercentage: pct,
        discountFrom: pct ? texto(f.discountFrom) : null,
        discountUntil: pct ? texto(f.discountUntil) : null,
        discountAllowsCoupons: !!pct && f.discountAllowsCoupons,
    };
};

/**
 * Alta y edición de una sección de la tienda: datos, cómo se eligen los
 * productos (a mano o por regla) y descuento opcional.
 */
export default function StoreSectionEdit() {
    const { id } = useParams();
    const nueva = id === 'nueva';
    const navigate = useNavigate();

    const [form, setForm] = useState(vacia);
    const [slug, setSlug] = useState('');
    const [productos, setProductos] = useState([]);   // manual: elegidos; regla: vista previa
    const [catalogo, setCatalogo] = useState([]);
    const [filtro, setFiltro] = useState({ texto: '', tipo: ALIMENTOS, especie: '' });
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(!nueva);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false);

    useEffect(() => {
        axios.get(API_CATALOGO).then(({ data }) => setCatalogo(data)).catch(() => setError('Error al cargar el catálogo de productos'));
    }, []);

    useEffect(() => {
        if (nueva) return;
        (async () => {
            try {
                const { data } = await axios.get(`${API_SECCIONES}/${id}`);
                const s = data.section;
                setForm({ ...vacia, ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ''])) });
                setSlug(s.slug);
                setProductos(data.products);
            } catch (err) {
                setError(err.response?.status === 404 ? 'La sección no existe.' : 'Error al cargar la sección');
            } finally {
                setCargando(false);
            }
        })();
    }, [id, nueva]);

    const cambiar = (campo, valor) => { setForm(prev => ({ ...prev, [campo]: valor })); setCambiosSinGuardar(true); };

    // Marcas para la regla: las que aparecen en el catálogo.
    const marcas = useMemo(() => [...new Set(catalogo.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [catalogo]);

    const elegidos = useMemo(() => new Set(productos.map(p => p.productId)), [productos]);

    const resultados = useMemo(() => {
        const q = filtro.texto.trim().toLowerCase();
        return catalogo.filter(p =>
            p.type !== 'servicio' &&
            (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)) &&
            (!filtro.tipo || (filtro.tipo === ALIMENTOS ? p.type === 'alimento-seco' || p.type === 'alimento-humedo' : p.type === filtro.tipo)) &&
            (!filtro.especie || p.species === filtro.especie || p.species === 'ambos')
        );
    }, [catalogo, filtro]);
    const paginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, paginas);
    const enPagina = resultados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
    const cambiarFiltro = (campo, valor) => { setFiltro(prev => ({ ...prev, [campo]: valor })); setPagina(1); };

    const agregar = (p) => {
        if (elegidos.has(p.productId) || productos.length >= MAX_MANUAL) return;
        // Precio y stock llegan al guardar: el catálogo de clasificación no los trae.
        setProductos(prev => [...prev, { productId: p.productId, name: p.name, sku: p.sku, brand: p.brand, price: null, finalPrice: null, stock: null, visible: true, nuevo: true }]);
        setCambiosSinGuardar(true);
    };
    const quitar = (productId) => { setProductos(prev => prev.filter(p => p.productId !== productId)); setCambiosSinGuardar(true); };
    const mover = (i, delta) => {
        const destino = i + delta;
        if (destino < 0 || destino >= productos.length) return;
        const nuevos = [...productos];
        [nuevos[i], nuevos[destino]] = [nuevos[destino], nuevos[i]];
        setProductos(nuevos);
        setCambiosSinGuardar(true);
    };

    // Regla → manual: la lista arranca con lo que traía la regla (ya calculado en
    // la vista previa), así solo se suma o quita lo que haga falta.
    const cambiarModo = (modo) => {
        if (modo === form.mode) return;
        cambiar('mode', modo);
        setProductos(prev => (modo === 'manual' ? prev.slice(0, MAX_MANUAL) : []));
    };

    const verRegla = async () => {
        setError('');
        try {
            const { data } = await axios.post(`${API_SECCIONES}/preview`, cuerpo({ ...form, title: form.title.trim() || 'Vista previa' }));
            setProductos(data);
        } catch (err) {
            setError(mensajeError(err, 'Error al calcular los productos'));
        }
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        setAviso('');
        setGuardando(true);
        try {
            let seccionId = id;
            if (nueva) {
                const { data } = await axios.post(API_SECCIONES, cuerpo(form));
                seccionId = data.id;
            } else {
                await axios.put(`${API_SECCIONES}/${id}`, cuerpo(form));
            }
            if (form.mode === 'manual') {
                const { data } = await axios.put(`${API_SECCIONES}/${seccionId}/products`, productos.map(p => p.productId));
                setProductos(data);
            }
            setCambiosSinGuardar(false);
            if (nueva) {
                navigate(`/secciones-web/${seccionId}`, { replace: true });
            } else {
                if (form.mode === 'regla') await verRegla();
                setAviso('Sección guardada. La tienda la muestra en hasta 1 minuto.');
            }
        } catch (err) {
            setError(mensajeError(err, 'Error al guardar la sección'));
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return <div className="container"><div className="loading-container">Cargando sección...</div></div>;

    const regla = form.mode === 'regla';
    const conDescuento = Number(form.discountPercentage) > 0;

    return (
        <div className="container">
            <div className="page-header">
                <h1><LayoutList size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />{nueva ? 'Nueva sección' : form.title || 'Sección'}</h1>
                <Link to="/secciones-web" className="btn btn-secondary">Volver a secciones</Link>
            </div>

            {error && <div className="error-message" role="alert">{error}</div>}
            {aviso && <div className="sb-aviso" role="status">{aviso}</div>}

            <form className="sb-form" onSubmit={guardar}>
                <div className="sb-grid">
                    <div className="sb-field">
                        <label className="input-label" htmlFor="ss-titulo">Título</label>
                        <input id="ss-titulo" className="input-field" required maxLength={80} value={form.title} onChange={(e) => cambiar('title', e.target.value)} placeholder="Alimento BARF" />
                        {slug && <small className="sb-ayuda">Página: /seccion/{slug} (no cambia aunque cambies el título)</small>}
                    </div>
                    <div className="sb-field">
                        <label className="input-label" htmlFor="ss-bajada">Bajada (opcional)</label>
                        <input id="ss-bajada" className="input-field" maxLength={160} value={form.subtitle} onChange={(e) => cambiar('subtitle', e.target.value)} placeholder="Comida natural, cruda y congelada" />
                    </div>
                    <div className="sb-field">
                        <label className="input-label" htmlFor="ss-inicio">Productos en el inicio</label>
                        <input id="ss-inicio" className="input-field" type="number" min={0} max={24} value={form.homeLimit} onChange={(e) => cambiar('homeLimit', e.target.value)} />
                        <small className="sb-ayuda">0: no aparece en el inicio, solo tiene su página. Van primero los que tienen stock.</small>
                    </div>
                    <div className="sb-field">
                        <label className="input-label" htmlFor="ss-modo">Productos</label>
                        <select id="ss-modo" className="input-field" value={form.mode} onChange={(e) => cambiarModo(e.target.value)}>
                            <option value="manual">Elegidos a mano</option>
                            <option value="regla">Por regla (se actualiza solo)</option>
                        </select>
                        <small className="sb-ayuda">
                            {regla
                                ? 'Pasala a "Elegidos a mano" para sumar productos de otras marcas o tipos: arranca con los que trae la regla.'
                                : 'Elegís uno por uno, de cualquier marca o tipo.'}
                        </small>
                    </div>
                </div>

                {regla && (
                    <fieldset className="sb-field" style={{ border: 0, padding: 0 }}>
                        <legend className="input-label">Regla: entran los productos que cumplen todo lo elegido</legend>
                        <div className="sb-grid">
                            <select aria-label="Especie" className="input-field" value={form.ruleSpecies} onChange={(e) => cambiar('ruleSpecies', e.target.value)}>
                                <option value="">Cualquier especie</option>
                                {Object.entries(ESPECIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <select aria-label="Tipo" className="input-field" value={form.ruleType} onChange={(e) => cambiar('ruleType', e.target.value)}>
                                <option value="">Cualquier tipo</option>
                                {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <select aria-label="Marca" className="input-field" value={form.ruleBrand} onChange={(e) => cambiar('ruleBrand', e.target.value)}>
                                <option value="">Cualquier marca</option>
                                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="sb-checks">
                            <label><input type="checkbox" checked={!!form.ruleOnlyOffers} onChange={(e) => cambiar('ruleOnlyOffers', e.target.checked)} /> Solo productos en oferta</label>
                        </div>
                    </fieldset>
                )}

                <fieldset className="sb-field" style={{ border: 0, padding: 0 }}>
                    <legend className="input-label">Descuento (opcional)</legend>
                    <div className="sb-grid">
                        <div className="sb-field">
                            <label className="input-label" htmlFor="ss-pct">% de descuento</label>
                            <input id="ss-pct" className="input-field" type="number" min={0} max={90} step="0.01" value={form.discountPercentage} onChange={(e) => cambiar('discountPercentage', e.target.value)} placeholder="Sin descuento" />
                        </div>
                        {conDescuento && (
                            <>
                                <div className="sb-field">
                                    <label className="input-label" htmlFor="ss-desde">Desde (opcional)</label>
                                    <input id="ss-desde" className="input-field" type="date" value={form.discountFrom} onChange={(e) => cambiar('discountFrom', e.target.value)} />
                                </div>
                                <div className="sb-field">
                                    <label className="input-label" htmlFor="ss-hasta">Hasta, inclusive (opcional)</label>
                                    <input id="ss-hasta" className="input-field" type="date" value={form.discountUntil} onChange={(e) => cambiar('discountUntil', e.target.value)} />
                                </div>
                            </>
                        )}
                    </div>
                    {conDescuento && (
                        <>
                            <div className="sb-checks">
                                <label><input type="checkbox" checked={!!form.discountAllowsCoupons} onChange={(e) => cambiar('discountAllowsCoupons', e.target.checked)} /> Se puede usar un cupón encima</label>
                            </div>
                            <small className="sb-ayuda">
                                Baja el precio en la tienda, el carrito y el cobro; no en el mostrador. No se suma a la oferta del producto: queda el precio más bajo de los dos.
                                Si el producto está en otra sección con descuento, gana el % mayor.
                            </small>
                        </>
                    )}
                </fieldset>

                <div className="sb-checks">
                    <label><input type="checkbox" checked={!!form.isActive} onChange={(e) => cambiar('isActive', e.target.checked)} /> Mostrar en la tienda</label>
                </div>

                <div className="sb-actions">
                    <button type="submit" className="btn btn-primary" disabled={guardando}><Save size={16} /> <span style={{ marginLeft: '0.4rem' }}>{guardando ? 'Guardando…' : 'Guardar'}</span></button>
                    {cambiosSinGuardar && <span className="sb-sub">Hay cambios sin guardar</span>}
                </div>
            </form>

            {/* Productos de la sección */}
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <div className="table-toolbar">
                    <strong>{regla ? `Productos que entran (${productos.length}${productos.length >= 48 ? '+' : ''})` : `Productos elegidos (${productos.length}/${MAX_MANUAL})`}</strong>
                    {regla && <button type="button" className="btn btn-secondary btn-sm" onClick={verRegla}><RefreshCw size={14} /> <span style={{ marginLeft: '0.3rem' }}>Ver productos de la regla</span></button>}
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            {!regla && <th style={{ width: '5rem' }}>Orden</th>}
                            <th>Producto</th>
                            <th>Stock</th>
                            <th>Precio</th>
                            <th>Precio web</th>
                            {!regla && <th style={{ textAlign: 'right' }}>Quitar</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((p, i) => (
                            <tr key={p.productId}>
                                {!regla && (
                                    <td>
                                        <div className="sb-row-actions" style={{ justifyContent: 'flex-start' }}>
                                            <button type="button" className="icon-btn" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${p.name}`}><ArrowUp size={16} /></button>
                                            <button type="button" className="icon-btn" onClick={() => mover(i, 1)} disabled={i === productos.length - 1} aria-label={`Bajar ${p.name}`}><ArrowDown size={16} /></button>
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <strong>{p.name}</strong>
                                    <div className="sb-sub">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</div>
                                    {!p.nuevo && !p.visible && (
                                        <div className="sb-falta"><AlertTriangle size={12} /> No se muestra: {p.stock > 0 ? 'oculto en la tienda' : 'sin stock'}</div>
                                    )}
                                </td>
                                <td>{p.stock ?? '—'}</td>
                                <td>{pesos(p.price)}</td>
                                <td>{p.nuevo ? <span className="sb-sub">al guardar</span> : p.finalPrice < p.price ? <strong>{pesos(p.finalPrice)}</strong> : pesos(p.finalPrice)}</td>
                                {!regla && (
                                    <td style={{ textAlign: 'right' }}>
                                        <button type="button" className="icon-btn delete-btn" onClick={() => quitar(p.productId)} aria-label={`Quitar ${p.name}`}><X size={16} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {productos.length === 0 && (
                            <tr><td colSpan={6} className="text-center" style={{ padding: '1.5rem' }}>
                                {regla ? 'Elegí la regla y tocá "Ver productos de la regla".' : 'Todavía no hay productos. Agregalos desde el buscador de abajo.'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
                {conDescuento && <small className="sb-ayuda" style={{ display: 'block', padding: '0.5rem 1rem' }}>&quot;Precio web&quot; se recalcula al guardar.</small>}
            </div>

            {/* Buscador para agregar (solo manual) */}
            {!regla && (
                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                    <div className="table-toolbar">
                        <div className="table-toolbar__group">
                            <Search size={16} />
                            <input className="input-field" aria-label="Buscar producto" placeholder="Nombre, SKU o marca" value={filtro.texto} onChange={(e) => cambiarFiltro('texto', e.target.value)} />
                            <select className="input-field" aria-label="Tipo" value={filtro.tipo} onChange={(e) => cambiarFiltro('tipo', e.target.value)}>
                                <option value={ALIMENTOS}>Alimentos (seco y húmedo)</option>
                                <option value="">Todos los tipos</option>
                                {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <select className="input-field" aria-label="Especie" value={filtro.especie} onChange={(e) => cambiarFiltro('especie', e.target.value)}>
                                <option value="">Todas las especies</option>
                                {Object.entries(ESPECIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <span className="sb-sub">{resultados.length} productos</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Producto</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Agregar</th></tr>
                        </thead>
                        <tbody>
                            {enPagina.map(p => (
                                <tr key={p.productId}>
                                    <td><strong>{p.name}</strong><div className="sb-sub">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</div></td>
                                    <td>{TIPOS[p.type] ?? '—'}{p.species && <div className="sb-sub">{ESPECIES[p.species] ?? p.species}</div>}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => agregar(p)}
                                            disabled={elegidos.has(p.productId) || productos.length >= MAX_MANUAL}>
                                            {elegidos.has(p.productId) ? 'Agregado' : <><Plus size={14} /> <span style={{ marginLeft: '0.3rem' }}>Agregar</span></>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {resultados.length === 0 && (
                                <tr><td colSpan={3} className="text-center" style={{ padding: '1.5rem' }}>No hay productos con ese filtro.</td></tr>
                            )}
                        </tbody>
                    </table>
                    {paginas > 1 && (
                        <div className="sb-actions" style={{ padding: '0.75rem 1rem', justifyContent: 'center' }}>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)}>Anterior</button>
                            <span className="sb-sub">Página {paginaActual} de {paginas}</span>
                            <button type="button" className="btn btn-secondary btn-sm" disabled={paginaActual === paginas} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
