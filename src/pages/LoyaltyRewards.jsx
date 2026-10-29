import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Gift, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { LOYALTY_API, puntos, mensajeDeError } from '../loyalty';
import '../Loyalty.css';

const vacio = { name: '', description: '', imageUrl: '', pointsCost: '', stock: '', isActive: true, sortOrder: 0 };

/** Catálogo de premios que se canjean con puntos. Solo Admin. */
export default function LoyaltyRewards() {
    const [premios, setPremios] = useState([]);
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');

    const cargar = () => axios.get(`${LOYALTY_API}/rewards`).then(({ data }) => setPremios(data)).catch(() => setPremios([]));
    useEffect(() => { cargar(); }, []);

    const abrir = (p) => {
        setError('');
        setForm(p ? { ...vacio, ...p, stock: p.stock ?? '', description: p.description ?? '', imageUrl: p.imageUrl ?? '' } : { ...vacio });
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        // Stock vacío: sin límite.
        const datos = { ...form, pointsCost: Number(form.pointsCost), stock: form.stock === '' ? null : Number(form.stock), sortOrder: Number(form.sortOrder) || 0 };
        try {
            if (form.id) await axios.put(`${LOYALTY_API}/rewards/${form.id}`, datos);
            else await axios.post(`${LOYALTY_API}/rewards`, datos);
            setForm(null);
            cargar();
        } catch (err) {
            setError(mensajeDeError(err, 'No se pudo guardar el premio.'));
        }
    };

    const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const activos = premios.filter(p => p.isActive).length;

    return (
        <div className="container loyalty">
            <PageHeader
                breadcrumb={[{ label: 'Fidelización' }, { label: 'Catálogo' }]}
                title="Catálogo"
                subtitle={`${premios.length} ${premios.length === 1 ? 'premio' : 'premios'} · ${activos} ${activos === 1 ? 'activo' : 'activos'}`}
                actions={<button className="btn btn-primary" onClick={() => abrir(null)}><Plus /> Nuevo premio</button>}
            />

            {premios.length === 0 && <div className="card empty-state">Todavía no hay premios.</div>}
            <div className="loyalty-catalog">
                {premios.map(p => (
                    <div key={p.id} className={`card loyalty-catalog__item${p.isActive ? '' : ' inactive'}`}>
                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span className="loyalty-catalog__img"><Gift /></span>}
                        <div className="loyalty-catalog__title">
                            <strong>{p.name}</strong>
                            <span className={`badge ${p.isActive ? 'badge--success' : 'badge--danger'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span>
                        </div>
                        {p.description && <p className="loyalty-muted">{p.description}</p>}
                        <div className="loyalty-catalog__footer">
                            <span>
                                <strong className="loyalty-brand">{puntos(p.pointsCost)} pts</strong>
                                <span className="loyalty-muted"> · {p.stock == null ? 'Sin límite' : p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}</span>
                            </span>
                            <button className="icon-btn edit-btn" title="Editar" aria-label={`Editar ${p.name}`} onClick={() => abrir(p)}><Edit /></button>
                        </div>
                    </div>
                ))}
            </div>

            {form && (
                <div className="modal-overlay" onClick={() => setForm(null)}>
                    <form className="modal-content" role="dialog" aria-modal="true" aria-labelledby="reward-title" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
                        <div className="modal-header">
                            <h2 id="reward-title">{form.id ? 'Editar premio' : 'Nuevo premio'}</h2>
                            <button type="button" onClick={() => setForm(null)} className="close-btn" aria-label="Cerrar"><X /></button>
                        </div>
                        <div className="modal-body loyalty-form-grid">
                            <div className="form-group loyalty-form-grid__full">
                                <label className="input-label" htmlFor="rw-name">Nombre</label>
                                <input id="rw-name" className="input-field" value={form.name} onChange={set('name')} maxLength={100} required autoFocus />
                            </div>
                            <div className="form-group loyalty-form-grid__full">
                                <label className="input-label" htmlFor="rw-desc">Descripción (opcional)</label>
                                <textarea id="rw-desc" className="input-field" rows={2} value={form.description} onChange={set('description')} maxLength={1000} />
                            </div>
                            <div className="form-group">
                                <label className="input-label" htmlFor="rw-cost">Costo en puntos</label>
                                <input id="rw-cost" className="input-field" type="number" min="1" step="1" value={form.pointsCost} onChange={set('pointsCost')} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label" htmlFor="rw-stock">Stock (vacío: sin límite)</label>
                                <input id="rw-stock" className="input-field" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
                            </div>
                            <div className="form-group loyalty-form-grid__full">
                                <span className="input-label">Imagen (opcional)</span>
                                <CloudinaryUpload
                                    imageUrl={form.imageUrl}
                                    onImageUpload={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                                    cloudName={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}
                                    uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}
                                />
                            </div>
                            <label className="loyalty-check loyalty-form-grid__full">
                                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Activo (se puede canjear)
                            </label>
                            {error && <div className="notice notice--danger loyalty-form-grid__full" role="alert">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
