import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShippingConfig() {
    const { user } = useAuth();
    const [config, setConfig] = useState({
        isShippingModuleEnabled: false,
        flatShippingCost: 0,
        freeShippingThreshold: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/site-config/admin`);
            setConfig({
                isShippingModuleEnabled: response.data.isShippingModuleEnabled || false,
                flatShippingCost: response.data.flatShippingCost || 0,
                freeShippingThreshold: response.data.freeShippingThreshold || 0
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching shipping config:", err);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/site-config`, config);
            setMessage({ type: 'success', text: 'Configuración de envíos actualizada' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Error saving shipping config:", err);
            setMessage({ type: 'error', text: 'Error al ahorrar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-container">Cargando configuración de envíos...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Configuración de Envíos</h1>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: 'var(--primary-color)' }}>
                    <Truck size={32} />
                    <p style={{ margin: 0, color: '#6b7280' }}>
                        Configura las reglas de logística para las compras realizadas a través de la página web.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Módulo de Envíos</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Activar o desactivar cargos por logística</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={config.isShippingModuleEnabled}
                                onChange={(e) => setConfig({ ...config, isShippingModuleEnabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div style={{ opacity: config.isShippingModuleEnabled ? 1 : 0.5, pointerEvents: config.isShippingModuleEnabled ? 'auto' : 'none', transition: 'all 0.3s' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Costo Fijo de Envío ($)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={config.flatShippingCost}
                                onChange={(e) => setConfig({ ...config, flatShippingCost: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                placeholder="Ej: 500"
                            />
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                                Este monto se sumará al total si no se alcanza el umbral de envío gratuito.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Umbral de Envío Gratuito ($)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={config.freeShippingThreshold}
                                onChange={(e) => setConfig({ ...config, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                placeholder="Ej: 10000"
                            />
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                                Compras superiores a este monto tendrán envío sin cargo. (0 = Siempre se cobra)
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div style={{ 
                            padding: '1rem', 
                            borderRadius: '0.375rem', 
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                            color: message.type === 'success' ? '#059669' : '#dc2626',
                            fontSize: '0.875rem'
                        }}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={saving}
                    >
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </form>
            </div>
        </div>
    );
}
