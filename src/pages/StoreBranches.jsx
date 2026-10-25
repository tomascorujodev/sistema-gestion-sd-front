import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Save, X, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../StoreBranches.css';

const API = `${import.meta.env.VITE_API_URL}/api/store-branches`;
const TIENDA = import.meta.env.VITE_STORE_URL || '';

const vacio = { code: '', name: '', slug: '', address: '', city: '', phone: '', whatsApp: '', hours: '', mapsUrl: '', isPublic: false, pickupEnabled: true, sortOrder: 0 };

/**
 * Datos de las sucursales que muestra la tienda online. No toca usuarios,
 * turnos ni pedidos: cada ficha se vincula por el texto de sucursal que ya
 * usan los usuarios ("Código").
 */
export default function StoreBranches() {
    const [sucursales, setSucursales] = useState([]);
    const [codigos, setCodigos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [form, setForm] = useState(null);       // null: cerrado
    const [error, setError] = useState('');
    const [borrar, setBorrar] = useState(null);

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        try {
            setCargando(true);
            const [s, c] = await Promise.all([axios.get(API), axios.get(`${API}/codes`)]);
            setSucursales(s.data);
            setCodigos(c.data);
        } catch {
            setError('Error al cargar las sucursales');
        } finally {
            setCargando(false);
        }
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        // Los inputs devuelven texto; la API espera número en el orden.
        const datos = { ...form, sortOrder: Number(form.sortOrder) || 0 };
        try {
            if (form.id) await axios.put(`${API}/${form.id}`, datos);
            else await axios.post(API, datos);
            setForm(null);
            cargar();
        } catch (err) {
            // La API devuelve el motivo en texto: "Para mostrarla en la tienda hace falta la dirección."
            setError(typeof err.response?.data === 'string' ? err.response.data : 'Error al guardar la sucursal');
        }
    };

    const eliminar = async () => {
        try {
            await axios.delete(`${API}/${borrar.id}`);
            setBorrar(null);
            cargar();
        } catch {
            alert('Error al eliminar');
        }
    };

    const campo = (nombre, etiqueta, props = {}) => (
        <div className="sb-field">
            <label className="input-label" htmlFor={`sb-${nombre}`}>{etiqueta}</label>
            <input id={`sb-${nombre}`} className="input-field" value={form[nombre] ?? ''} onChange={(e) => setForm({ ...form, [nombre]: e.target.value })} {...props} />
        </div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1><Store size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Sucursales en la web</h1>
                {!form && (
                    <button className="btn btn-primary" onClick={() => { setError(''); setForm({ ...vacio, code: codigos[0] || '' }); }}>
                        <Plus size={16} /> <span style={{ marginLeft: '0.4rem' }}>Nueva</span>
                    </button>
                )}
            </div>
            <p className="sb-intro">
                Dirección, horarios y contacto que ve el cliente en la tienda online y como punto de retiro.
                Una sucursal recién creada queda oculta hasta que marques &quot;Mostrar en la tienda&quot;.
                Esto no cambia usuarios, turnos ni pedidos.
            </p>

            <ConfirmationModal isOpen={!!borrar} onClose={() => setBorrar(null)} onConfirm={eliminar} title="Eliminar ficha"
                message={borrar ? `Se borra la ficha web de "${borrar.name}". Los usuarios, turnos y pedidos de esa sucursal no cambian.` : ''}
                confirmText="Eliminar" isDestructive />

            {error && <div className="error-message" role="alert">{error}</div>}

            {form && (
                <form className="sb-form" onSubmit={guardar}>
                    <div className="sb-grid">
                        <div className="sb-field">
                            <label className="input-label" htmlFor="sb-code">Código de sucursal</label>
                            {form.id ? (
                                <input id="sb-code" className="input-field" value={form.code} disabled />
                            ) : (
                                <select id="sb-code" className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required>
                                    <option value="">Elegir…</option>
                                    {codigos.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                            <small className="sb-ayuda">El mismo nombre que tienen los usuarios de esa sucursal.</small>
                        </div>
                        {campo('name', 'Nombre para mostrar', { required: true, placeholder: 'Sucursal Tucumán' })}
                        {campo('address', 'Dirección', { placeholder: 'Calle 1234' })}
                        {campo('city', 'Localidad', { placeholder: 'Mar del Plata' })}
                        {campo('phone', 'Teléfono', { placeholder: '0223 …' })}
                        {campo('whatsApp', 'WhatsApp (con 549)', { placeholder: '5492231234567' })}
                        {campo('mapsUrl', 'Link de Google Maps (opcional)', { placeholder: 'https://maps.app.goo.gl/…' })}
                        {campo('sortOrder', 'Orden', { type: 'number', min: 0 })}
                    </div>
                    <div className="sb-field">
                        <label className="input-label" htmlFor="sb-hours">Horarios (una línea por franja)</label>
                        <textarea id="sb-hours" className="input-field" rows={3} value={form.hours ?? ''} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder={'Lun a Vie 9 a 20 h\nSáb 9 a 13 h'} />
                    </div>
                    <div className="sb-checks">
                        <label><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} /> Mostrar en la tienda</label>
                        <label><input type="checkbox" checked={form.pickupEnabled} onChange={(e) => setForm({ ...form, pickupEnabled: e.target.checked })} /> Permite retiro de pedidos</label>
                    </div>
                    <div className="sb-actions">
                        <button type="submit" className="btn btn-primary"><Save size={16} /> <span style={{ marginLeft: '0.4rem' }}>Guardar</span></button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setForm(null); setError(''); }}><X size={16} /> <span style={{ marginLeft: '0.4rem' }}>Cancelar</span></button>
                    </div>
                </form>
            )}

            {cargando ? (
                <div className="loading-container">Cargando sucursales...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sucursal</th>
                                <th>Dirección</th>
                                <th>Horarios</th>
                                <th>En la tienda</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sucursales.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong><div className="sb-sub">Código: {s.code}</div></td>
                                    <td>{[s.address, s.city].filter(Boolean).join(', ') || <span className="sb-falta">Sin cargar</span>}</td>
                                    <td className="sb-horarios">{s.hours || '—'}</td>
                                    <td>
                                        {s.isPublic
                                            ? <span className="sb-badge sb-badge-on"><Eye size={13} /> Visible</span>
                                            : <span className="sb-badge"><EyeOff size={13} /> Oculta</span>}
                                        {s.isPublic && TIENDA && <div><a className="sb-sub" href={`${TIENDA}/sucursales#${s.slug}`} target="_blank" rel="noreferrer">Ver en la tienda</a></div>}
                                    </td>
                                    <td>
                                        <div className="sb-row-actions">
                                            <button className="icon-btn edit-btn" onClick={() => { setError(''); setForm({ ...vacio, ...s }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Editar"><Edit size={16} /></button>
                                            <button className="icon-btn delete-btn" onClick={() => setBorrar(s)} title="Eliminar ficha"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sucursales.length === 0 && (
                                <tr><td colSpan={5} className="text-center" style={{ padding: '2rem' }}>No hay sucursales cargadas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
