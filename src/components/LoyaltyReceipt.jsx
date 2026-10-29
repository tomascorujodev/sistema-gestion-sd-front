import { puntos, conSigno, pesos, formatearDni, sucursalCorta } from '../loyalty';

/**
 * Comprobante de 58 mm para la impresora del mostrador. Solo se ve al
 * imprimir (window.print): el resto de la página queda oculto por CSS.
 */
export default function LoyaltyReceipt({ operation }) {
    if (!operation) return null;
    const { titulo, customer, points, amount, balance, ticketNumber, branch, detalle, createdAt } = operation;
    return (
        <div className="loyalty-receipt" aria-hidden="true">
            <div className="loyalty-receipt__brand">STREET DOG</div>
            <div>{sucursalCorta(branch)}</div>
            <div>{new Date(createdAt).toLocaleString('es-AR')}</div>
            <hr />
            <div><strong>{titulo}</strong></div>
            <div>{customer.firstName} {customer.lastName}</div>
            <div>DNI {formatearDni(customer.dni)}</div>
            {ticketNumber && <div>Ticket {ticketNumber}</div>}
            {detalle && <div>{detalle}</div>}
            {amount != null && <div>Monto: {pesos(amount)}</div>}
            <hr />
            <div className="loyalty-receipt__row"><span>Puntos</span><strong>{conSigno(points)}</strong></div>
            <div className="loyalty-receipt__row"><span>Saldo</span><strong>{puntos(balance)}</strong></div>
            <hr />
            <div>Consultá tus puntos en streetdog.com.ar</div>
        </div>
    );
}
