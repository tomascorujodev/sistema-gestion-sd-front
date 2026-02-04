import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Power } from 'lucide-react';
import CloudinaryUpload from '../components/CloudinaryUpload';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Design.css';

export default function Design() {
    const [config, setConfig] = useState({
        primaryColor: '#E11D48',
        secondaryColor: '#000000',
        cloudinaryCloudName: '',
        cloudinaryUploadPreset: '',
        cloudinaryUploadPreset: '',
        isStoreEnabled: true,
        theme: 'Dark'
    });
    const [carouselImages, setCarouselImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null });

    useEffect(() => {
        fetchConfig();
        fetchImages();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-config/admin`);
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    primaryColor: data.primaryColor || '#E11D48',
                    secondaryColor: data.secondaryColor || '#000000',
                    cloudinaryCloudName: data.cloudinaryCloudName || '',
                    cloudinaryUploadPreset: data.cloudinaryUploadPreset || '',
                    isStoreEnabled: data.isStoreEnabled !== undefined ? data.isStoreEnabled : true,
                    theme: data.theme || 'Dark'
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const fetchImages = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-config/images`);
            if (res.ok) {
                const data = await res.json();
                setCarouselImages(data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching images:', error);
            setLoading(false);
        }
    };

    const handleConfigChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'isStoreEnabled') {
            if (!checked) {
                // If turning off, ask for confirmation
                setConfirmModal({
                    show: true,
                    action: () => {
                        setConfig(prev => ({ ...prev, [name]: false }));
                    }
                });
            } else {
                setConfig(prev => ({ ...prev, [name]: true }));
            }
        } else {
            setConfig(prev => ({ ...prev, [name]: value }));
        }
    };

    const saveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            } else {
                setMessage({ type: 'error', text: 'Error al guardar la configuración' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de red' });
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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-config/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newImage)
            });

            if (res.ok) {
                const savedImage = await res.json();
                setCarouselImages([...carouselImages, savedImage]);
                setMessage({ type: 'success', text: 'Imagen agregada correctamente' });
            }
        } catch (error) {
            console.error('Error adding image:', error);
        }
    };

    const handleDeleteImage = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/site-config/images/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setCarouselImages(carouselImages.filter(img => img.id !== id));
                setMessage({ type: 'success', text: 'Imagen eliminada' });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleUpdateImage = async (id, field, value) => {
        const image = carouselImages.find(img => img.id === id);
        if (!image) return;

        const updatedImage = { ...image, [field]: value };
        setCarouselImages(carouselImages.map(img => img.id === id ? updatedImage : img));

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/site-config/images/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedImage)
            });
        } catch (error) {
            console.error('Error updating image:', error);
        }
    };

    if (loading) return <div className="loading-container">Cargando...</div>;

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
                message="¿Estás seguro de que quieres deshabilitar el sitio web? Los clientes verán una página de mantenimiento y no podrán realizar compras."
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

                        <div className="input-group">
                            <label className="input-label">Tema del Sitio</label>
                            <select
                                name="theme"
                                value={config.theme || 'Dark'}
                                onChange={handleConfigChange}
                                className="input-field"
                                style={{ width: '100%', padding: '0.75rem' }}
                            >
                                <option value="Dark">Modo Oscuro (Default)</option>
                                <option value="Light">Modo Luz (Blanco/Bordó)</option>
                                <option value="Christmas">Modo Navidad</option>
                                <option value="Anniversary">Modo Aniversario (Dorado)</option>
                            </select>
                        </div>



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
