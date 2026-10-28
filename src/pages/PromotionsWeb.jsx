import { useState, useEffect } from 'react';
import axios from 'axios';
import { Percent, Save, X, Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../StoreBranches.css';

const API = `${import.meta.env.VITE_API_URL}/api/promotion-web`;

const MEDIOS = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'mercadopago', label: 'Mercado Pago' },
    { value: 'openpay', label: 'Openpay (BBVA)' },
];
const conTarjeta = (medio) => medio === 'mercadopago' || medio === 'openpay';

// Bits de DayOfWeek del backend: domingo = 0 … sábado = 6. Se muestran de lunes a domingo.
const DIAS = [
    { bit: 1, label: 'Lun' }, { bit: 2, label: 'Mar' }, { bit: 3, label: 'Mié' }, { bit: 4, label: 'Jue' },
    { bit: 5, label: 'Vie' }, { bit: 6, label: 'Sáb' }, { bit: 0, label: 'Dom' },
];

const vacio = {
    visible: false, paymentMethod: 'transferencia', storeDiscountPercentage: 0, storeDiscountCap: '',
    bankRefundPercentage: 0, bankRefundCap: '', interestFreeInstallments: '', daysOfWeek: 0,
    bank: '', cardBins: '', bannerText: '', combinableWithCoupons: false,
};

const textoDias = (mascara) => mascara === 0 ? 'Todos los días' : DIAS.filter(d => mascara & (1 << d.bit)).map(d => d.label).join(', ');
const nombreMedio = (m) => MEDIOS.find(x => x.value === m)?.label ?? m;

/**
 * Qué promociones de gestión aparecen y se aplican en la tienda online.
 * La promo (descripción, vigencia) se sigue cargando en Promociones; acá
 * solo se dice cómo se usa en la web. No modifica la promo original.
 */
export default function PromotionsWeb() {
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [form, setForm] = useState(null);       // { promotion, ...campos web }
    const [error, setError] = useState('');
    const [quitar, setQuitar] = useState(null);
    const [verVencidas, setVerVencidas] = useState(false);

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        try {
            setCargando(true);
            const { data } = await axios.get(API);
            setFilas(data);
        } catch {
            setError('Error al cargar las promociones');
        } finally {
            setCargando(false);
        }
    };

    const editar = (fila) => {
        setError('');
        const w = fila.web ?? {};
        setForm({
            ...vacio,
            ...Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v ?? ''])),
            // Valor inicial razonable: el % que figura en la promo de gestión.
            storeDiscountPercentage: fila.web ? w.storeDiscountPercentage : fila.promotion.discountPercentage,
            promotion: fila.promotion,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        const num = (v) => (v === '' || v === null ? null : Number(v));
        const datos = {
            visible: form.visible,
            paymentMethod: form.paymentMethod,
            storeDiscountPercentage: Number(form.storeDiscountPercentage) || 0,
            storeDiscountCap: num(form.storeDiscountCap),
            bankRefundPercentage: Number(form.bankRefundPercentage) || 0,
            bankRefundCap: num(form.bankRefundCap),
            interestFreeInstallments: num(form.interestFreeInstallments),
            daysOfWeek: form.daysOfWeek,
            bank: conTarjeta(form.paymentMethod) ? form.bank : '',
            cardBins: conTarjeta(form.paymentMethod) ? form.cardBins : '',
            bannerText: form.bannerText,
            combinableWithCoupons: form.combinableWithCoupons,
        };
        try {
            await axios.put(`${API}/${form.promotion.id}`, datos);
            setForm(null);
            cargar();
        } catch (err) {
            // La API explica el motivo: "Para mostrar una promo de BBVA hacen falta los BIN…"
            setError(typeof err.response?.data === 'string' ? err.response.data : 'Error al guardar');
        }
    };

    const confirmarQuitar = async () => {
        try {
            await axios.delete(`${API}/${quitar.promotion.id}`);
            setQuitar(null);
            cargar();
        } catch {
            alert('Error al quitar');
        }
    };

    const alternarDia = (bit) => setForm({ ...form, daysOfWeek: form.daysOfWeek ^ (1 << bit) });

    const campo = (nombre, etiqueta, props = {}) => (
        <div className="sb-field">
            <label className="input-label" htmlFor={`pw-${nombre}`}>{etiqueta}</label>
            <input id={`pw-${nombre}`} className="input-field" value={form[nombre] ?? ''} onChange={(e) => setForm({ ...form, [nombre]: e.target.value })} {...props} />
        </div>
    );

    const visibles = filas.filter(f => verVencidas || !f.vencida);

    return (
        <div className="container">
            <div className="page-header">
                <h1><Percent size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Promociones en la web</h1>
            </div>
            <p className="sb-intro">
                Elegí qué promociones de gestión ve y aprovecha el cliente en la tienda online. La descripción y la vigencia
                salen de Promociones. Solo baja el precio el &quot;descuento de la tienda&quot;; el reintegro del banco se muestra como información.
                Openpay: la promo la elige el cliente al pagar (Openpay no informa la tarjeta, no se verifica). Mercado Pago: las promos de un banco necesitan los BIN (primeros 6 a 8 dígitos de la tarjeta). Las promos de otros medios se muestran en la tienda y el pago se coordina con el vendedor.
            </p>

            <ConfirmationModal isOpen={!!quitar} onClose={() => setQuitar(null)} onConfirm={confirmarQuitar} title="Quitar de la web"
                message={quitar ? `"${quitar.promotion.description}" deja de aparecer en la tienda. La promoción de gestión no se modifica.` : ''}
                confirmText="Quitar" isDestructive />

            {error && <div className="error-message" role="alert">{error}</div>}

            {form && (
                <form className="sb-form" onSubmit={guardar}>
                    <p style={{ marginTop: 0 }}>
                        <strong>{form.promotion.description}</strong>
                        <span className="sb-sub"> · {form.promotion.discountPercentage}% · vence {new Date(form.promotion.validUntil).toLocaleDateString('es-AR')}</span>
                        {form.promotion.discountResponsible && <span className="sb-sub" style={{ display: 'block' }}>{form.promotion.discountResponsible}</span>}
                    </p>
                    <div className="sb-grid">
                        <div className="sb-field">
                            <label className="input-label" htmlFor="pw-medio">Medio de pago en la web</label>
                            <select id="pw-medio" className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                                {MEDIOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        {campo('storeDiscountPercentage', 'Descuento de la tienda (%)', { type: 'number', min: 0, max: 100, step: '0.01' })}
                        {campo('storeDiscountCap', 'Tope del descuento ($, opcional)', { type: 'number', min: 0, step: '0.01' })}
                        {campo('bankRefundPercentage', 'Reintegro del banco (%)', { type: 'number', min: 0, max: 100, step: '0.01' })}
                        {campo('bankRefundCap', 'Tope del reintegro ($, opcional)', { type: 'number', min: 0, step: '0.01' })}
                        {campo('interestFreeInstallments', 'Cuotas sin interés (opcional)', { type: 'number', min: 0 })}
                        {conTarjeta(form.paymentMethod) && campo('bank', 'Banco (vacío: cualquier tarjeta)', { placeholder: 'BBVA' })}
                        {campo('bannerText', 'Texto para la tienda (opcional)', { maxLength: 120, placeholder: 'Martes 10% + 30% de reintegro con BBVA' })}
                    </div>
                    {conTarjeta(form.paymentMethod) && (
                        <div className="sb-field">
                            <label className="input-label" htmlFor="pw-bins">BIN de las tarjetas del banco, separados por coma</label>
                            <textarea id="pw-bins" className="input-field" rows={2} value={form.cardBins ?? ''} onChange={(e) => setForm({ ...form, cardBins: e.target.value })} placeholder="450799, 451766" />
                            <small className="sb-ayuda">Los primeros 6 a 8 dígitos de cada tarjeta que entra en la promo. Los informa el banco. Obligatorio con Mercado Pago si cargás un banco; con Openpay no se usan.</small>
                        </div>
                    )}
                    <div className="sb-field">
                        <span className="input-label">Días</span>
                        <div className="sb-checks">
                            {DIAS.map(d => (
                                <label key={d.bit}><input type="checkbox" checked={(form.daysOfWeek & (1 << d.bit)) !== 0} onChange={() => alternarDia(d.bit)} /> {d.label}</label>
                            ))}
                        </div>
                        <small className="sb-ayuda">Sin ningún día marcado: aplica todos los días.</small>
                    </div>
                    <div className="sb-checks">
                        <label><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Mostrar y aplicar en la tienda</label>
                        <label><input type="checkbox" checked={!!form.combinableWithCoupons} onChange={(e) => setForm({ ...form, combinableWithCoupons: e.target.checked })} /> Se acumula con cupones</label>
                    </div>
                    <small className="sb-ayuda">Si no se acumula y el cliente usa un cupón, se aplica el mayor de los dos descuentos, nunca ambos.</small>
                    <div className="sb-checks">
                    </div>
                    <div className="sb-actions">
                        <button type="submit" className="btn btn-primary"><Save size={16} /> <span style={{ marginLeft: '0.4rem' }}>Guardar</span></button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setForm(null); setError(''); }}><X size={16} /> <span style={{ marginLeft: '0.4rem' }}>Cancelar</span></button>
                    </div>
                </form>
            )}

            <div className="sb-checks" style={{ marginBottom: '0.75rem' }}>
                <label><input type="checkbox" checked={verVencidas} onChange={(e) => setVerVencidas(e.target.checked)} /> Mostrar vencidas</label>
            </div>

            {cargando ? (
                <div className="loading-container">Cargando promociones...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Promoción</th>
                                <th>En la web</th>
                                <th>Descuento / reintegro</th>
                                <th>Días</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(({ promotion: p, web: w, vencida }) => (
                                <tr key={p.id}>
                                    <td>
                                        <strong>{p.description}</strong>
                                        <div className="sb-sub">{p.paymentMethods || '—'} · vence {new Date(p.validUntil).toLocaleDateString('es-AR')}{vencida && ' (vencida)'}</div>
                                    </td>
                                    <td>{w ? <>{nombreMedio(w.paymentMethod)}{w.bank && <div className="sb-sub">{w.bank}{w.cardBins ? ` · ${w.cardBins.split(',').length} BIN` : ''}</div>}</> : <span className="sb-falta">Sin configurar</span>}</td>
                                    <td>{w ? <>{w.storeDiscountPercentage}% tienda{w.bankRefundPercentage > 0 && ` + ${w.bankRefundPercentage}% reintegro`}{w.interestFreeInstallments && <div className="sb-sub">{w.interestFreeInstallments} cuotas s/interés</div>}<div className="sb-sub">{w.combinableWithCoupons ? 'Se acumula con cupones' : 'No se acumula con cupones'}</div></> : '—'}</td>
                                    <td>{w ? textoDias(w.daysOfWeek) : '—'}</td>
                                    <td>
                                        {w?.visible && !vencida
                                            ? <span className="sb-badge sb-badge-on"><Eye size={13} /> Visible</span>
                                            : <span className="sb-badge"><EyeOff size={13} /> Oculta</span>}
                                    </td>
                                    <td>
                                        <div className="sb-row-actions">
                                            <button className="icon-btn edit-btn" onClick={() => editar({ promotion: p, web: w })} title="Configurar para la web"><Edit size={16} /></button>
                                            {w && <button className="icon-btn delete-btn" onClick={() => setQuitar({ promotion: p })} title="Quitar de la web"><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visibles.length === 0 && (
                                <tr><td colSpan={6} className="text-center" style={{ padding: '2rem' }}>No hay promociones cargadas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
