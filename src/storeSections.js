// Compartido por las pantallas de Secciones de la tienda (Página Web > Secciones).

export const API_SECCIONES = `${import.meta.env.VITE_API_URL}/api/store-sections`;

/** Mensaje de error de la API: texto plano (validaciones propias) o ProblemDetails (modelo inválido). */
export const mensajeError = (err, porDefecto) => {
    const d = err.response?.data;
    if (typeof d === 'string') return d;
    if (d?.errors) return Object.values(d.errors).flat().join(' ');
    return d?.title || porDefecto;
};

const fecha = (iso) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR') : null;

export const textoDescuento = (s) => {
    if (!s.discountPercentage) return null;
    const desde = fecha(s.discountFrom), hasta = fecha(s.discountUntil);
    const vigencia = desde && hasta ? `del ${desde} al ${hasta}` : desde ? `desde el ${desde}` : hasta ? `hasta el ${hasta}` : 'sin vencimiento';
    return `−${s.discountPercentage}% ${vigencia}`;
};
