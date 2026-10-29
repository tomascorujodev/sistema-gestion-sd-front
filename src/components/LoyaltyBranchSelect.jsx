/** Selector de sucursal para un Admin (un Operator opera siempre en la suya). */
export default function LoyaltyBranchSelect({ elegida, sucursales, onChange }) {
    return (
        <select className="form-select" value={elegida} onChange={(e) => onChange(e.target.value)} aria-label="Sucursal">
            <option value="">Elegir sucursal…</option>
            {sucursales.map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
        </select>
    );
}
