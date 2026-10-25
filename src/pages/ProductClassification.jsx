import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Save, RotateCcw, Tags } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../ProductClassification.css';

const API = `${import.meta.env.VITE_API_URL}/api/product-attributes`;
const POR_PAGINA = 50;

// Etiquetas de los valores que define la API (Utils/Taxonomia.cs).
const ETIQUETAS = {
    species: { perro: 'Perro', gato: 'Gato', ambos: 'Ambos', otros: 'Otros' },
    type: {
        'alimento-seco': 'Alimento seco', 'alimento-humedo': 'Alimento húmedo', snacks: 'Snacks',
        sanitarios: 'Sanitarios', accesorios: 'Accesorios', salud: 'Salud', servicio: 'Servicio (no se muestra)', otros: 'Otros'
    },
    lifeStage: { cachorro: 'Cachorro', adulto: 'Adulto', senior: 'Senior' },
    petSize: { chico: 'Chico', mediano: 'Mediano', grande: 'Grande' }
};

const CAMPOS = ['species', 'type', 'lifeStage', 'petSize', 'netWeightKg'];

function Selector({ campo, valor, onChange, vacio = '—' }) {
    return (
        <select className="input-field cl-select" value={valor ?? ''} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">{vacio}</option>
            {Object.entries(ETIQUETAS[campo]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
    );
}

export default function ProductClassification() {
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({ search: '', species: '', type: '', source: '', sinClasificar: false });
    const [cambios, setCambios] = useState({});         // productId -> { campo: valor }
    const [seleccion, setSeleccion] = useState(new Set());
    const [masivo, setMasivo] = useState({ species: '', type: '', lifeStage: '', petSize: '' });
    const [pagina, setPagina] = useState(1);
    const [ocupado, setOcupado] = useState(false);
    const [aviso, setAviso] = useState('');
    const [modal, setModal] = useState({ isOpen: false });

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        try {
            setCargando(true);
            const res = await axios.get(API);
            setFilas(res.data);
            setError('');
        } catch {
            setError('Error al cargar la clasificación de productos');
        } finally {
            setCargando(false);
        }
    };

    // Filtros en el navegador: la lista completa son ~1200 filas.
    const visibles = useMemo(() => {
        const q = filtros.search.trim().toLowerCase();
        return filas.filter(f =>
            (!q || f.name.toLowerCase().includes(q) || f.sku.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q)) &&
            (!filtros.species || (filtros.species === 'null' ? !f.species : f.species === filtros.species)) &&
            (!filtros.type || f.type === filtros.type) &&
            (!filtros.source || f.source === filtros.source) &&
            (!filtros.sinClasificar || !f.species || !f.type || f.type === 'otros' || f.source === 'sin-clasificar')
        );
    }, [filas, filtros]);

    const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, paginas);
    const enPagina = visibles.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

    const resumen = useMemo(() => ({
        total: filas.length,
        manual: filas.filter(f => f.source === 'manual').length,
        revisar: filas.filter(f => !f.species || !f.type || f.type === 'otros').length
    }), [filas]);

    const cambiarFiltro = (campo, valor) => { setFiltros(prev => ({ ...prev, [campo]: valor })); setPagina(1); };

    const valorDe = (fila, campo) => (cambios[fila.productId] && campo in cambios[fila.productId]) ? cambios[fila.productId][campo] : fila[campo];
    const editar = (id, campo, valor) => setCambios(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
    const tieneCambios = (id) => cambios[id] && Object.keys(cambios[id]).length > 0;

    const reemplazarFila = (actualizada) => setFilas(prev => prev.map(f => f.productId === actualizada.productId ? actualizada : f));

    const guardar = async (fila, extra = {}) => {
        const cuerpo = Object.fromEntries(CAMPOS.map(c => [c, c in extra ? extra[c] : valorDe(fila, c)]));
        if (cuerpo.netWeightKg === '' || cuerpo.netWeightKg === undefined) cuerpo.netWeightKg = null;
        else if (cuerpo.netWeightKg !== null) cuerpo.netWeightKg = Number(cuerpo.netWeightKg);
        const res = await axios.put(`${API}/${fila.productId}`, cuerpo);
        reemplazarFila(res.data);
        setCambios(prev => { const n = { ...prev }; delete n[fila.productId]; return n; });
    };

    const guardarFila = async (fila) => {
        try { await guardar(fila); }
        catch (err) { alert(err.response?.data?.title || 'Error al guardar la clasificación'); }
    };

    const volverAAutomatico = (fila) => setModal({
        isOpen: true,
        title: 'Volver a la clasificación automática',
        message: `"${fila.name}" va a perder la corrección manual y el clasificador lo va a volver a calcular.`,
        onConfirm: async () => {
            setModal({ isOpen: false });
            try {
                await axios.delete(`${API}/${fila.productId}/manual`);
                await cargar();
            } catch { alert('Error al volver a automático'); }
        }
    });

    const aplicarMasivo = async () => {
        const extra = Object.fromEntries(Object.entries(masivo).filter(([, v]) => v));
        if (Object.keys(extra).length === 0) { alert('Elegí al menos un valor para aplicar'); return; }
        setOcupado(true);
        let ok = 0, fallidos = 0;
        // Uno por uno: la API no tiene edición en lote y así un error no frena al resto.
        for (const id of seleccion) {
            const fila = filas.find(f => f.productId === id);
            if (!fila) continue;
            try { await guardar(fila, extra); ok++; } catch { fallidos++; }
        }
        setOcupado(false);
        setSeleccion(new Set());
        setMasivo({ species: '', type: '', lifeStage: '', petSize: '' });
        setAviso(`${ok} productos actualizados${fallidos ? `, ${fallidos} con error` : ''}.`);
    };

    const reclasificar = async () => {
        setOcupado(true);
        try {
            const res = await axios.post(`${API}/reclassify`);
            await cargar();
            setAviso(`Clasificación automática: ${res.data.creados} nuevos, ${res.data.actualizados} actualizados. ${res.data.manuales} correcciones manuales sin tocar.`);
        } catch { alert('Error al reclasificar'); }
        finally { setOcupado(false); }
    };

    const alternar = (id) => setSeleccion(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const todosEnPagina = enPagina.length > 0 && enPagina.every(f => seleccion.has(f.productId));
    const alternarPagina = () => setSeleccion(prev => {
        const n = new Set(prev);
        enPagina.forEach(f => todosEnPagina ? n.delete(f.productId) : n.add(f.productId));
        return n;
    });

    return (
        <div className="container">
            <div className="page-header">
                <h1><Tags size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Clasificación de productos</h1>
            </div>
            <p className="cl-intro">
                Así se agrupan los productos en la tienda online (Perros, Gatos y sus filtros). Se clasifican solos a partir del nombre
                y la familia de Posberry; lo que corrijas acá queda fijo y el clasificador automático no lo vuelve a tocar.
            </p>

            <ConfirmationModal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} confirmText="Confirmar" />

            <div className="cl-resumen">
                <div><strong>{resumen.total}</strong> productos</div>
                <div><strong>{resumen.manual}</strong> corregidos a mano</div>
                <button className="cl-link" onClick={() => cambiarFiltro('sinClasificar', true)}><strong>{resumen.revisar}</strong> para revisar</button>
                <button className="btn btn-secondary cl-reclasificar" onClick={reclasificar} disabled={ocupado}>
                    <RefreshCw size={16} /> <span>Reclasificar ahora</span>
                </button>
            </div>

            <div className="cl-toolbar">
                <div className="cl-search">
                    <Search size={16} />
                    <input type="text" placeholder="Buscar por nombre, SKU o marca..." value={filtros.search} onChange={(e) => cambiarFiltro('search', e.target.value)} />
                </div>
                <select className="input-field cl-filtro" value={filtros.species} onChange={(e) => cambiarFiltro('species', e.target.value)}>
                    <option value="">Todas las especies</option>
                    {Object.entries(ETIQUETAS.species).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    <option value="null">Sin especie</option>
                </select>
                <select className="input-field cl-filtro" value={filtros.type} onChange={(e) => cambiarFiltro('type', e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {Object.entries(ETIQUETAS.type).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select className="input-field cl-filtro" value={filtros.source} onChange={(e) => cambiarFiltro('source', e.target.value)}>
                    <option value="">Automáticos y manuales</option>
                    <option value="auto">Solo automáticos</option>
                    <option value="manual">Solo corregidos a mano</option>
                </select>
                <label className="cl-check">
                    <input type="checkbox" checked={filtros.sinClasificar} onChange={(e) => cambiarFiltro('sinClasificar', e.target.checked)} />
                    Solo para revisar
                </label>
            </div>

            {seleccion.size > 0 && (
                <div className="cl-masivo">
                    <strong>{seleccion.size} seleccionados:</strong>
                    <Selector campo="species" valor={masivo.species} onChange={(v) => setMasivo({ ...masivo, species: v || '' })} vacio="Especie…" />
                    <Selector campo="type" valor={masivo.type} onChange={(v) => setMasivo({ ...masivo, type: v || '' })} vacio="Tipo…" />
                    <Selector campo="lifeStage" valor={masivo.lifeStage} onChange={(v) => setMasivo({ ...masivo, lifeStage: v || '' })} vacio="Etapa…" />
                    <Selector campo="petSize" valor={masivo.petSize} onChange={(v) => setMasivo({ ...masivo, petSize: v || '' })} vacio="Tamaño…" />
                    <button className="btn btn-primary" onClick={aplicarMasivo} disabled={ocupado}>Aplicar</button>
                    <button className="btn btn-secondary" onClick={() => setSeleccion(new Set())} disabled={ocupado}>Cancelar</button>
                </div>
            )}

            {aviso && <div className="cl-aviso" role="status">{aviso} <button className="cl-link" onClick={() => setAviso('')}>Cerrar</button></div>}

            {cargando ? (
                <div className="loading-container">Cargando productos...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="data-table cl-tabla">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" checked={todosEnPagina} onChange={alternarPagina} aria-label="Seleccionar página" /></th>
                                    <th>Producto</th>
                                    <th>Especie</th>
                                    <th>Tipo</th>
                                    <th>Etapa</th>
                                    <th>Tamaño</th>
                                    <th>Peso (kg)</th>
                                    <th>Origen</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enPagina.map(f => (
                                    <tr key={f.productId} className={tieneCambios(f.productId) ? 'cl-fila-editada' : ''}>
                                        <td><input type="checkbox" checked={seleccion.has(f.productId)} onChange={() => alternar(f.productId)} aria-label={`Seleccionar ${f.name}`} /></td>
                                        <td>
                                            <div className="cl-nombre">{f.name}</div>
                                            <div className="cl-sub">{f.brand || f.category} · {f.sku}</div>
                                        </td>
                                        {['species', 'type', 'lifeStage', 'petSize'].map(c => (
                                            <td key={c}><Selector campo={c} valor={valorDe(f, c)} onChange={(v) => editar(f.productId, c, v)} /></td>
                                        ))}
                                        <td>
                                            <input type="number" min="0" step="0.1" className="input-field cl-peso" value={valorDe(f, 'netWeightKg') ?? ''}
                                                onChange={(e) => editar(f.productId, 'netWeightKg', e.target.value)} />
                                        </td>
                                        <td><span className={`cl-badge cl-badge-${f.source}`}>{f.source === 'manual' ? 'Manual' : f.source === 'auto' ? 'Automático' : 'Sin clasificar'}</span></td>
                                        <td>
                                            <div className="cl-acciones">
                                                {tieneCambios(f.productId) && (
                                                    <button className="btn btn-primary cl-guardar" onClick={() => guardarFila(f)} title="Guardar"><Save size={14} /> Guardar</button>
                                                )}
                                                {f.source === 'manual' && !tieneCambios(f.productId) && (
                                                    <button className="icon-btn" onClick={() => volverAAutomatico(f)} title="Volver a automático"><RotateCcw size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {enPagina.length === 0 && (
                                    <tr><td colSpan={9} className="text-center" style={{ padding: '2rem' }}>No hay productos con esos filtros.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="cl-paginacion">
                        <span>{visibles.length} productos · página {paginaActual} de {paginas}</span>
                        <button className="btn btn-secondary" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual <= 1}>Anterior</button>
                        <button className="btn btn-secondary" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual >= paginas}>Siguiente</button>
                    </div>
                </>
            )}
        </div>
    );
}
