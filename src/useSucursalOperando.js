import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const BRANCH_KEY = 'sd.loyaltyBranch';

function leer() {
    try { return localStorage.getItem(BRANCH_KEY) || ''; } catch { return ''; }
}

/**
 * Sucursal en la que se registran las operaciones de puntos. Un Operator usa
 * la de su usuario; un Admin no tiene, así que elige una (y queda recordada).
 */
export default function useSucursalOperando() {
    const { user } = useAuth();
    const propia = user?.branch || '';
    const [elegida, setElegida] = useState(leer);
    const [sucursales, setSucursales] = useState([]);

    useEffect(() => {
        if (propia) return;
        axios.get(`${import.meta.env.VITE_API_URL}/api/store-branches`)
            .then(({ data }) => setSucursales(data))
            .catch(() => setSucursales([]));
    }, [propia]);

    const elegir = (codigo) => {
        setElegida(codigo);
        try { localStorage.setItem(BRANCH_KEY, codigo); } catch { /* solo esta sesión */ }
    };

    return { sucursal: propia || elegida, propia, elegida, sucursales, elegir };
}
