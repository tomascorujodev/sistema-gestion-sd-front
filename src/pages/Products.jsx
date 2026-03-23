import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ImageOff, Loader } from 'lucide-react';
import ProductForm from '../components/ProductForm';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [infoModal, setInfoModal] = useState({ show: false, title: '', message: '', isError: false });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);
    const [cleanupModal, setCleanupModal] = useState({ show: false });
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, pageSize, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/categories`);
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
                params: {
                    page,
                    pageSize,
                    category: categoryFilter
                }
            });
            setProducts(response.data.items || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalCount || 0);
            setLoading(false);
        } catch (err) {
            console.error('Error loading products:', err);
            setError('Error al cargar productos');
            setProducts([]); // Ensure products is array on error
            setLoading(false);
        }
    };

    const handleImportClick = () => {
        document.getElementById('fileInput').click();
    };

    const handleCleanupBrokenImages = async () => {
        setCleanupModal({ show: false });
        setCleanupLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/products/cleanup-broken-images`);
            const { checkedCount, cleanedCount, cleanedProducts } = response.data;
            setCleanupResult({ checkedCount, cleanedCount, cleanedProducts });
            if (cleanedCount > 0) {
                await fetchProducts(); // Refrescar lista si hubo cambios
            }
        } catch (err) {
            console.error('Error en limpieza de imágenes:', err);
            setInfoModal({
                show: true,
                title: 'Error',
                message: 'No se pudo completar la limpieza de imágenes: ' + (err.response?.data || err.message),
                isError: true
            });
        } finally {
            setCleanupLoading(false);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/products/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            await fetchProducts();
            await fetchCategories(); // Refresh categories after import
            await fetchProducts();
            await fetchCategories(); // Refresh categories after import
            setInfoModal({
                show: true,
                title: 'Importación Exitosa',
                message: 'Productos importados correctamente.',
                isError: false
            });
        } catch (err) {
            console.error(err);
            setInfoModal({
                show: true,
                title: 'Error de Importación',
                message: 'Error al importar productos: ' + (err.response?.data || err.message),
                isError: true
            });
        } finally {
            setLoading(false);
            event.target.value = null; // Reset input
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = async (productData) => {
        try {
            if (editingProduct) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, { ...productData, id: editingProduct.id });
                setProducts(products.map(p => p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p));
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, productData);
            }
            fetchProducts(); // Refresh list
            fetchCategories(); // Refresh categories in case new one added
            setIsModalOpen(false);
        } catch (err) {
            alert('Error al guardar producto');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${deleteModal.id}`);
            fetchProducts();
            setDeleteModal({ show: false, id: null });
        } catch (err) {
            alert('Error al eliminar producto');
            setDeleteModal({ show: false, id: null });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1); // Reset to first page when changing page size
    };

    if (loading) return <div className="loading-container">Cargando productos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Eliminar Producto"
                message="¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                isDestructive={true}
            />
            <ConfirmationModal
                isOpen={infoModal.show}
                onClose={() => setInfoModal({ ...infoModal, show: false })}
                onConfirm={() => setInfoModal({ ...infoModal, show: false })}
                title={infoModal.title}
                message={infoModal.message}
                confirmText="Aceptar"
                isDestructive={false}
                showCancel={false}
            />
            {/* Modal de confirmación de limpieza */}
            <ConfirmationModal
                isOpen={cleanupModal.show}
                onClose={() => setCleanupModal({ show: false })}
                onConfirm={handleCleanupBrokenImages}
                title="Limpiar imágenes rotas"
                message="Este proceso revisará todos los productos con imagen y eliminará las referencias a imágenes que ya no existen en Cloudinary. Las imágenes válidas no serán afectadas. ¿Desea continuar?"
                confirmText="Limpiar"
                isDestructive={false}
            />

            {/* Modal de resultado de limpieza */}
            {cleanupResult && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '0.75rem', padding: '2rem',
                        maxWidth: '520px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1e293b' }}>
                            Limpieza completada
                        </h2>
                        <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
                            Se revisaron <strong>{cleanupResult.checkedCount}</strong> productos con imagen.
                        </p>
                        {cleanupResult.cleanedCount === 0 ? (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem', padding: '1rem', color: '#166534', fontSize: '0.9rem'
                            }}>
                                ✅ ¡Todo en orden! No se encontraron imágenes rotas.
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    background: '#fefce8', border: '1px solid #fde68a',
                                    borderRadius: '0.5rem', padding: '0.75rem 1rem',
                                    color: '#92400e', fontSize: '0.9rem', marginBottom: '1rem'
                                }}>
                                    ⚠️ Se limpiaron <strong>{cleanupResult.cleanedCount}</strong> imágenes rotas.
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                                    {cleanupResult.cleanedProducts.map((p, i) => (
                                        <div key={i} style={{
                                            padding: '0.4rem 0',
                                            borderBottom: '1px solid #f1f5f9',
                                            color: '#475569'
                                        }}>
                                            <strong>{p.name}</strong>
                                            <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                                ID #{p.id}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setCleanupResult(null)}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h1>Productos</h1>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {totalRecords} {totalRecords === 1 ? 'producto' : 'productos'} en total
                </div>
                <div className="header-actions">
                    <select
                        className="form-select"
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPage(1); // Reset to first page on filter change
                        }}
                        style={{ marginRight: '1rem', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => {
                            const catName = typeof cat === 'object' ? (cat.name || cat.Name || '') : cat;
                            return <option key={catName} value={catName}>{catName}</option>;
                        })}
                    </select>
                    <input
                        type="file"
                        id="fileInput"
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => setCleanupModal({ show: true })}
                        disabled={cleanupLoading}
                        title="Detectar y limpiar imágenes que ya no existen en Cloudinary"
                        style={{ marginRight: '1rem', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center' }}
                    >
                        {cleanupLoading
                            ? <Loader size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                            : <ImageOff size={16} style={{ marginRight: '0.5rem' }} />
                        }
                        {cleanupLoading ? 'Verificando...' : 'Limpiar imágenes rotas'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleImportClick} style={{ marginRight: '1rem', backgroundColor: '#28a745', color: 'white' }}>
                        <Upload size={16} style={{ marginRight: '0.5rem' }} />
                        Importar Excel
                    </button>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        <Plus size={16} style={{ marginRight: '0.5rem' }} />
                        Agregar Producto
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    ) : (
                                        <div style={{ width: '50px', height: '50px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Sin imagen</div>
                                    )}
                                </td>
                                <td>{product.name}</td>
                                <td>{product.sku}</td>
                                <td>{product.category}</td>
                                <td>${product.price.toFixed(2)}</td>
                                <td>{product.stock}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: product.isActive ? '#dcfce7' : '#fee2e2',
                                            color: product.isActive ? '#166534' : '#991b1b'
                                        }}>
                                            {product.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                        {product.isOnOffer && (
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: '#fef3c7',
                                                color: '#92400e'
                                            }}>
                                                OFERTA
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn edit-btn"
                                            title="Editar"
                                            onClick={() => handleEdit(product)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="icon-btn delete-btn"
                                            title="Eliminar"
                                            onClick={() => handleDeleteClick(product.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center">No se encontraron productos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Consistent with Reports */}
            {totalRecords > 0 && (
                <div className="pagination-controls">
                    {/* Page Size Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</label>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                background: 'white'
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>por página</span>
                    </div>

                    {/* Page Info */}
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Página {page} de {totalPages}
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: page === 1 ? '#f1f5f9' : 'white',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: page === 1 ? 0.5 : 1
                            }}
                            title="Primera página"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: page === 1 ? '#f1f5f9' : 'white',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: page === 1 ? 0.5 : 1
                            }}
                            title="Página anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: page === totalPages ? '#f1f5f9' : 'white',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: page === totalPages ? 0.5 : 1
                            }}
                            title="Página siguiente"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: page === totalPages ? '#f1f5f9' : 'white',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: page === totalPages ? 0.5 : 1
                            }}
                            title="Última página"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <ProductForm
                    product={editingProduct}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
