import { useState } from 'react';
import { Upload, X as XIcon } from 'lucide-react';
import '../CloudinaryUpload.css';

export default function CloudinaryUpload({ imageUrl, onImageUpload, cloudName, uploadPreset }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(imageUrl || null);

    // Initialize Cloudinary widget when component mounts
    const openCloudinaryWidget = () => {
        // Check if Cloudinary is loaded
        if (typeof window.cloudinary === 'undefined') {
            alert('Cloudinary no está cargado. Por favor, recarga la página.');
            return;
        }

        // Create and open the widget
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: cloudName || 'YOUR_CLOUD_NAME',
                uploadPreset: uploadPreset || 'YOUR_UPLOAD_PRESET',
                sources: ['local', 'url', 'camera'],
                multiple: false,
                maxFiles: 1,
                cropping: false,
                folder: 'petshop_products',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                maxFileSize: 5000000, // 5MB
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    const imageUrl = result.info.secure_url;
                    setPreview(imageUrl);
                    onImageUpload(imageUrl);
                    setUploading(false);
                } else if (error) {
                    console.error('Upload error:', error);
                    setUploading(false);
                }
            }
        );
        widget.open();
        setUploading(true);
    };

    const handleRemoveImage = () => {
        setPreview(null);
        onImageUpload(null);
    };

    return (
        <div className="cloudinary-upload">
            {preview ? (
                <div className="image-preview-container">
                    <img src={preview} alt="Preview" className="image-preview" />
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="remove-image-btn"
                        title="Eliminar imagen"
                    >
                        <XIcon size={16} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={openCloudinaryWidget}
                    className="upload-btn"
                    disabled={uploading}
                >
                    <Upload size={20} />
                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </button>
            )}
        </div>
    );
}
