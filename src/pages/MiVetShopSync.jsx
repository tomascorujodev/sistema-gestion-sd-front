import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload, FileDown, AlertCircle, CheckCircle } from 'lucide-react';
import '../Products.css'; // Import system styles for buttons and inputs

export default function MiVetShopSync() {
    const { user } = useAuth();
    const [excelFile, setExcelFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleFileChange = (e, setFile) => {
        const file = e.target.files[0];
        if (file) setFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!excelFile || !csvFile) {
            setStatus({ type: 'error', message: 'Por favor selecciona ambos archivos.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        formData.append('excelFile', excelFile);
        formData.append('csvFile', csvFile);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/mivetshop/sync`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                responseType: 'blob' // Important for file download
            });

            // Trigger Download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = "mivetshop_actualizado.csv";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setStatus({ type: 'success', message: '¡Procesamiento exitoso! El archivo se ha descargado.' });
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.text ? await error.response.data.text() : (error.response?.data || error.message);
            // If response is blob, we might need to read it to get text error
            if (error.response?.data instanceof Blob) {
                const text = await error.response.data.text();
                setStatus({ type: 'error', message: text || 'Error al procesar archivos' });
            } else {
                setStatus({ type: 'error', message: errorMsg || 'Error al procesar archivos' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1>Sincronización Mi Vet Shop</h1>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    Sube la planilla de <strong>Posberry (.xlsx)</strong> y la planilla de <strong>Mi Vet Shop (.csv)</strong>.
                    El sistema actualizará los precios automáticamente (aplicando 15% de descuento).
                </p>

                {status.message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        backgroundColor: status.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        color: status.type === 'error' ? '#991b1b' : '#166534',
                        border: status.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0'
                    }}>
                        {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        <span>{status.message}</span>
                    </div>
                )}

                <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSubmit}>

                        {/* Input Excel */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                1. Planilla Posberry (.xlsx)
                            </label>
                            <div style={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                                className="hover:bg-gray-50">
                                <Upload className="text-gray-400" />
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={(e) => handleFileChange(e, setExcelFile)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        {/* Input CSV */}
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                2. Planilla Mi Vet Shop (.csv)
                            </label>
                            <div style={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                                className="hover:bg-gray-50">
                                <Upload className="text-gray-400" />
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleFileChange(e, setCsvFile)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem' }}
                        >
                            {loading ? (
                                "Procesando..."
                            ) : (
                                <>
                                    <FileDown size={20} style={{ marginRight: '0.5rem' }} />
                                    Procesar y Descargar CSV
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
