import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CloudinaryUpload from './CloudinaryUpload';
import '../ProductForm.css';

export default function ProductForm({ product, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock: '',
        imageUrl: '',
        description: '',
        isActive: true,
        isOnOffer: false,
        offerPrice: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl || '',
                description: product.description || '',
                isActive: product.isActive !== undefined ? product.isActive : true,
                isOnOffer: product.isOnOffer || false,
                offerPrice: product.offerPrice || ''
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = (url) => {
        setFormData(prev => ({
            ...prev,
            imageUrl: url || ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{product ? 'Editar Producto' : 'Agregar Producto'}</h2>
                    <button onClick={onCancel} className="close-btn">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nombre</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="form-group">
                        <label>SKU</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                    <div className="form-group">
                        <label>Categoría</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Precio</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                step="0.01"
                                required
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label>Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* New Fields: Image Upload */}
                    <div className="form-group">
                        <label>Imagen del Producto</label>
                        <CloudinaryUpload
                            imageUrl={formData.imageUrl}
                            onImageUpload={handleImageUpload}
                            cloudName={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}
                            uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-field"
                            rows="4"
                            placeholder="Descripción detallada del producto..."
                        />
                    </div>

                    {/* New Fields: Active Status and Offer */}
                    <div className="form-row">
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="checkbox-input"
                                />
                                <span className="text-sm">Producto Activo</span>
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isOnOffer"
                                    checked={formData.isOnOffer}
                                    onChange={handleChange}
                                    className="checkbox-input"
                                />
                                <span className="text-sm">En Oferta</span>
                            </label>
                        </div>
                    </div>

                    {/* Offer Price - Only show if isOnOffer is true */}
                    {formData.isOnOffer && (
                        <div className="form-group">
                            <label>Precio de Oferta</label>
                            <input
                                type="number"
                                name="offerPrice"
                                value={formData.offerPrice}
                                onChange={handleChange}
                                step="0.01"
                                className="input-field"
                                placeholder="Ingrese el precio especial"
                            />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" onClick={onCancel} className="btn btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
