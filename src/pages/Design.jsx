import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Power, Clock } from 'lucide-react';
import CloudinaryUpload from '../components/CloudinaryUpload';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import '../Design.css';

// axios lleva el token de sesión (AuthContext); con fetch() estas llamadas
// salían sin login y el backend (solo Admin) las rechazaba con 401.
const API = `${import.meta.env.VITE_API_URL}/api/site-config`;

export default function Design() {
    const { setIsShiftsEnabled } = useAuth();
    const [config, setConfig] = useState(null);
    const [carouselImages, setCarouselImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null });

    useEffect(() => {
        Promise.all([fetchConfig(), fetchImages()]).finally(() => setLoading(false));
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await axios.get(`${API}/admin`);
            setConfig({
                isStoreEnabled: data.isStoreEnabled ?? true,
                isShiftsEnabled: data.isShiftsEnabled ?? true
            });
        } catch (error) {
            console.error('Error fetching config:', error);
            setLoadError(true);
        }
    };

    const fetchImages = async () => {
        try {
            const { data } = await axios.get(`${API}/images`);
            setCarouselImages(data);
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    const handleConfigChange = (e) => {
        const { name, checked } = e.target;

        if (name === 'isStoreEnabled' && !checked) {
            // Apagar la tienda pide confirmación
            setConfirmModal({
                show: true,
                action: () => setConfig(prev => ({ ...prev, isStoreEnabled: false }))
            });
        } else {
            setConfig(prev => ({ ...prev, [name]: checked }));
        }
    };

    const saveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // El backend actualiza solo los campos enviados: no pisa la config de Envíos.
            await axios.put(API, {
                isStoreEnabled: config.isStoreEnabled,
                isShiftsEnabled: config.isShiftsEnabled
            });
            setIsShiftsEnabled(config.isShiftsEnabled);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        } catch (error) {
            const status = error.response?.status;
            setMessage({
                type: 'error',
                text: status === 401 || status === 403
                    ? 'No tenés permiso: iniciá sesión como Admin.'
                    : 'Error al guardar la configuración'
            });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleAddImage = async (url) => {
        if (!url) return;
        try {
            const newImage = {
                imageUrl: url,
                title: 'Nueva Imagen',
                link: '',
                isActive: true,
                order: carouselImages.length
            };
            const { data: savedImage } = await axios.post(`${API}/images`, newImage);
            setCarouselImages([...carouselImages, savedImage]);
            setMessage({ type: 'success', text: 'Imagen agregada correctamente' });
        } catch (error) {
            console.error('Error adding image:', error);
            setMessage({ type: 'error', text: 'Error al agregar la imagen' });
        }
    };

    const handleDeleteImage = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;
        try {
            await axios.delete(`${API}/images/${id}`);
            setCarouselImages(carouselImages.filter(img => img.id !== id));
            setMessage({ type: 'success', text: 'Imagen eliminada' });
        } catch (error) {
            console.error('Error deleting image:', error);
            setMessage({ type: 'error', text: 'Error al eliminar la imagen' });
        }
    };

    const handleUpdateImage = async (id, field, value) => {
        const image = carouselImages.find(img => img.id === id);
        if (!image) return;

        const updatedImage = { ...image, [field]: value };
        setCarouselImages(carouselImages.map(img => img.id === id ? updatedImage : img));

        try {
            await axios.put(`${API}/images/${id}`, updatedImage);
        } catch (error) {
            console.error('Error updating image:', error);
        }
    };

    if (loading) return <div className="loading-container">Cargando...</div>;
    if (loadError || !config) return (
        <div className="container">
            <div style={{ padding: '1rem', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                No se pudo cargar la configuración. Verificá que iniciaste sesión como Admin y recargá la página.
            </div>
        </div>
    );

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, action: null })}
                onConfirm={() => {
                    confirmModal.action && confirmModal.action();
                    setConfirmModal({ show: false, action: null });
                }}
                title="Deshabilitar Sitio Web"
                message="¿Estás seguro de que quieres deshabilitar el sitio web? Los clientes verán un aviso de «volvemos pronto» y no podrán realizar compras. Pueden seguir consultando sus pedidos."
                confirmText="Deshabilitar"
                isDestructive={true}
            />
            <div className="page-header">
                <h1>Diseño y Configuración Web</h1>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '0.375rem',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="design-layout">
                {/* General Settings */}
                <div className="design-section">
                    <h2 className="section-title">
                        <Save size={20} /> Configuración General
                    </h2>
                    <form onSubmit={saveConfig}>
                        <div className="input-group" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Power size={18} color={config.isStoreEnabled ? '#16a34a' : '#dc2626'} />
                                    Estado del Sitio Web
                                </label>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    {config.isStoreEnabled ? 'El sitio está visible para los clientes' : 'El sitio está en modo mantenimiento'}
                                </div>
                            </div>
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                <input
                                    type="checkbox"
                                    name="isStoreEnabled"
                                    checked={config.isStoreEnabled}
                                    onChange={handleConfigChange}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: config.isStoreEnabled ? '#22c55e' : '#cbd5e1',
                                    transition: '.4s', borderRadius: '34px'
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '20px', width: '20px',
                                        left: config.isStoreEnabled ? '26px' : '4px', bottom: '3px',
                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label className="input-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} color={config.isShiftsEnabled ? '#16a34a' : '#64748b'} />
                                    Sistema de Turnos y Operaciones
                                </label>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    {config.isShiftsEnabled ? 'Los operadores deben iniciar un turno para trabajar' : 'Apertura y cierre de turnos deshabilitado'}
                                </div>
                            </div>
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                <input
                                    type="checkbox"
                                    name="isShiftsEnabled"
                                    checked={config.isShiftsEnabled}
                                    onChange={handleConfigChange}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: config.isShiftsEnabled ? '#22c55e' : '#cbd5e1',
                                    transition: '.4s', borderRadius: '34px'
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '20px', width: '20px',
                                        left: config.isShiftsEnabled ? '26px' : '4px', bottom: '3px',
                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                            La tienda web usa un diseño fijo: tema y colores ya no se configuran desde acá.
                        </p>

                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '1rem' }}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </form>
                </div>

                {/* Carousel Management */}
                <div className="design-section">
                    <h2 className="section-title">
                        <Plus size={20} /> Carrusel de Imágenes
                    </h2>

                    <div className="upload-area">
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Agregar nueva imagen al carrusel</p>
                        <CloudinaryUpload
                            imageUrl={null}
                            onImageUpload={handleAddImage}
                            cloudName={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME'}
                            uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET'}
                        />
                    </div>

                    <div className="carousel-grid">
                        {carouselImages.map((img) => (
                            <div key={img.id} className="carousel-item">
                                <div className="carousel-preview">
                                    <img src={img.imageUrl} alt={img.title} />
                                </div>
                                <div className="carousel-details">
                                    <input
                                        type="text"
                                        value={img.title || ''}
                                        onChange={(e) => handleUpdateImage(img.id, 'title', e.target.value)}
                                        placeholder="Título (opcional)"
                                        className="carousel-input"
                                    />
                                    <input
                                        type="text"
                                        value={img.link || ''}
                                        onChange={(e) => handleUpdateImage(img.id, 'link', e.target.value)}
                                        placeholder="Link (ej. /products)"
                                        className="carousel-input"
                                    />
                                    <div className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={img.isActive}
                                            onChange={(e) => handleUpdateImage(img.id, 'isActive', e.target.checked)}
                                            id={`active-${img.id}`}
                                        />
                                        <label htmlFor={`active-${img.id}`}>Visible</label>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteImage(img.id)}
                                        className="icon-btn delete-btn"
                                        style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {carouselImages.length === 0 && (
                            <p className="text-center" style={{ color: '#6b7280', gridColumn: '1 / -1', padding: '2rem' }}>
                                No hay imágenes en el carrusel.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
