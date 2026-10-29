// Programa de puntos: lo que comparten las pantallas de Fidelización.

export const LOYALTY_API = `${import.meta.env.VITE_API_URL}/api/loyalty`;

export const TIPOS = {
    CompraMostrador: { label: 'Compra', badge: 'success' },
    CompraOnline: { label: 'Compra online', badge: 'success' },
    DescuentoMostrador: { label: 'Descuento', badge: 'danger' },
    Canje: { label: 'Canje', badge: 'warning' },
    Anulacion: { label: 'Anulación', badge: 'danger' },
    AjusteManual: { label: 'Ajuste', badge: 'info' },
    SaldoInicialMigracion: { label: 'Saldo migrado', badge: 'info' },
    HistorialFidebill: { label: 'Fidebill', badge: 'info' },
};

// Lo que se anula desde Movimientos. Los canjes se anulan desde Canjes
// (devuelve los puntos y repone el stock); el resto se corrige con un ajuste.
export const ANULABLES = ['CompraMostrador', 'DescuentoMostrador', 'AjusteManual'];

const numero = new Intl.NumberFormat('es-AR');
export const puntos = (n) => numero.format(n ?? 0);
export const conSigno = (n) => (n > 0 ? `+${puntos(n)}` : `−${puntos(Math.abs(n))}`);
export const pesos = (n) => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n ?? 0)}`;

export const formatearDni = (dni = '') => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const iniciales = (c) => `${c?.firstName?.[0] ?? ''}${c?.lastName?.[0] ?? ''}`.toUpperCase();

/** "Hoy 10:32", "Ayer 18:05" o "12/10 09:40". */
export function fechaCorta(iso) {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === hoy.toDateString()) return `Hoy ${hora}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${hora}`;
}

/** Hoy en formato yyyy-MM-dd (fecha local), para el filtro "desde". */
export function diaLocal(offsetDias = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** La API devuelve el motivo en texto plano: "El cliente no tiene puntos suficientes." */
export const mensajeDeError = (err, porDefecto = 'No se pudo completar la operación.') =>
    typeof err?.response?.data === 'string' && err.response.data ? err.response.data : porDefecto;

/** Ticket de la caja mientras se tipea: hasta 12 números y el guion después de los 4 primeros. */
export function formatearTicket(valor = '') {
    const digitos = valor.replace(/\D/g, '').slice(0, 12);
    return digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos;
}

export const ticketCompleto = (valor) => /^\d{4}-\d{8}$/.test(valor ?? '');

/** Una clave por operación: un doble clic o un reintento no la registra dos veces. */
export const nuevaClave = () => crypto.randomUUID();

/** Etiqueta de sucursal: "Sucursal Tucumán" → "Tucumán". */
export const sucursalCorta = (b) => (b ? b.replace(/^Sucursal\s+/i, '') : 'Tienda');
