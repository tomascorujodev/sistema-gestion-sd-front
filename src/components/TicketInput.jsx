import { formatearTicket } from '../loyalty';

/**
 * Número de ticket de la caja (0006-00000168): solo números, hasta 12, y el
 * guion se agrega solo después del punto de venta. Pegar "NRO. T 0006-00000168"
 * también funciona.
 */
export default function TicketInput({ id, value, onChange }) {
    return (
        <input
            id={id}
            className="input-field"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0006-00000168"
            maxLength={13}
            value={value ?? ''}
            onChange={(e) => onChange(formatearTicket(e.target.value))}
        />
    );
}
