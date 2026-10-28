import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Upload, ImageOff, Loader, Search, Settings2, X } from 'lucide-react';
import ProductForm from '../components/ProductForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [categoryToggleModal, setCategoryToggleModal] = useState({ show: false, categoryName: '', willBeActive: false });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, pageSize, categoryFilter, searchQuery]);

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
                    category: categoryFilter,
                    search: searchQuery
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

    const handleToggleClick = (categoryName, currentIsActive) => {
        setCategoryToggleModal({
            show: true,
            categoryName,
            willBeActive: !currentIsActive
        });
    };

    const confirmToggleCategory = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/products/categories/${encodeURIComponent(categoryToggleModal.categoryName)}/toggle`);
            setCategoryToggleModal({ show: false, categoryName: '', willBeActive: false });
            await fetchCategories(); // Refresh local list state
            await fetchProducts(); // Refresh products too (might need it if we change visibility, or just logic)
        } catch (err) {
            console.error('Error toggling category:', err);
            alert('Error al cambiar el estado de la categoría');
        }
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

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setPage(1); // Reset to first page when changing page size
    };

    const filteredCategories = categories.filter(c => {
        const name = typeof c === 'object' ? c.name : c;
        return name.toLowerCase().includes(categorySearchQuery.toLowerCase());
    });

    // Only show full-screen loader on initial empty load, so we don't unmount the search input while typing.
    if (loading && products.length === 0 && !searchQuery && !categoryFilter) return <div className="loading-container">Cargando productos...</div>;
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
                isDestructive={infoModal.isError}
                hideCancel={true}
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
            {/* Modal de confirmación de categorías */}
            <ConfirmationModal
                isOpen={categoryToggleModal.show}
                onClose={() => setCategoryToggleModal({ show: false, categoryName: '', willBeActive: false })}
                onConfirm={confirmToggleCategory}
                title={categoryToggleModal.willBeActive ? "Activar Categoría" : "Desactivar Categoría"}
                message={`¿Está seguro de que desea ${categoryToggleModal.willBeActive ? "activar" : "desactivar"} la categoría "${categoryToggleModal.categoryName}"? ${categoryToggleModal.willBeActive ? "Esta categoría y sus productos volverán a verse en la tienda pública." : "Esta categoría y todos sus productos dejarán de verse en la tienda pública hasta que vuelvas a activarla."}`}
                confirmText={categoryToggleModal.willBeActive ? "Activar" : "Desactivar"}
                isDestructive={!categoryToggleModal.willBeActive}
            />

            {/* Modal de resultado de limpieza */}
            {cleanupResult && (
                <div className="modal-overlay">
                    <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="cleanup-title">
                        <div className="modal-header">
                            <div>
                                <h2 id="cleanup-title">Limpieza completada</h2>
                                <p className="modal-subtitle">
                                    Se revisaron <strong>{cleanupResult.checkedCount}</strong> productos con imagen.
                                </p>
                            </div>
                            <button type="button" className="close-btn" onClick={() => setCleanupResult(null)} aria-label="Cerrar">
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            {cleanupResult.cleanedCount === 0 ? (
                                <div className="notice notice--success">
                                    ¡Todo en orden! No se encontraron imágenes rotas.
                                </div>
                            ) : (
                                <>
                                    <div className="notice notice--warning">
                                        Se limpiaron <strong>{cleanupResult.cleanedCount}</strong> imágenes rotas.
                                    </div>
                                    <ul className="simple-list">
                                        {cleanupResult.cleanedProducts.map((p, i) => (
                                            <li key={i}>
                                                <strong>{p.name}</strong>
                                                <span className="simple-list__meta">ID #{p.id}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setCleanupResult(null)}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                breadcrumb={[{ label: 'Página Web' }, { label: 'Productos' }]}
                title="Productos"
                subtitle={`${totalRecords} ${totalRecords === 1 ? 'producto' : 'productos'} en total`}
                actions={
                    <>
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                        <button className="btn btn-success" onClick={handleImportClick}>
                            <Upload />
                            Importar Excel
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd}>
                            <Plus />
                            Agregar Producto
                        </button>
                    </>
                }
            />

            <div className="table-container">
                <div className="table-toolbar">
                    <div className="table-toolbar__group products-filters">
                        <div className="search-field">
                            <Search />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Buscar producto..."
                                aria-label="Buscar producto"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={categoryFilter}
                            aria-label="Filtrar por categoría"
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Todas las Categorías</option>
                            {categories.map(cat => {
                                const catName = typeof cat === 'object' ? (cat.name || cat.Name || '') : cat;
                                return <option key={catName} value={catName}>{catName}</option>;
                            })}
                        </select>
                    </div>
                    <div className="table-toolbar__group products-utilities">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setIsCategoryModalOpen(true)}
                            title="Gestionar Categorías"
                        >
                            <Settings2 />
                            <span className="btn-label">Gestionar Categorías</span>
                        </button>
                        <button
                            className="btn btn-warning btn-sm"
                            onClick={() => setCleanupModal({ show: true })}
                            disabled={cleanupLoading}
                            title="Detectar y limpiar imágenes que ya no existen en Cloudinary"
                        >
                            {cleanupLoading
                                ? <Loader style={{ animation: 'spin 1s linear infinite' }} />
                                : <ImageOff />
                            }
                            <span className="btn-label">{cleanupLoading ? 'Verificando...' : 'Limpiar imágenes rotas'}</span>
                        </button>
                    </div>
                </div>
                <table className="data-table data-table--cards products-table">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th aria-label="Acciones"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="cell-media">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="product-thumb" />
                                    ) : (
                                        <div className="product-thumb product-thumb--empty" title="Sin imagen">
                                            <ImageOff size={18} />
                                        </div>
                                    )}
                                </td>
                                <td className="cell-main">{product.name}</td>
                                <td data-label="SKU" className="cell-meta" style={{ color: 'var(--color-text-tertiary)' }}>{product.sku}</td>
                                <td data-label="Categoría" className="cell-meta">{product.category}</td>
                                <td data-label="Precio" className="price-cell cell-price">${product.price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td data-label="Stock" className="cell-stock" style={product.stock === 0 ? { color: 'var(--color-text-danger)', fontWeight: 600 } : undefined}>{product.stock}</td>
                                <td data-label="Estado" className="cell-status">
                                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                        <span className={`badge ${product.isActive ? 'badge--success' : 'badge--danger'}`}>
                                            {product.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                        {product.isOnOffer && (
                                            <span className="badge badge--warning">Oferta</span>
                                        )}
                                    </div>
                                </td>
                                <td className="cell-actions">
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn edit-btn"
                                            title="Editar"
                                            aria-label={`Editar ${product.name}`}
                                            onClick={() => handleEdit(product)}
                                        >
                                            <Edit />
                                        </button>
                                        <button
                                            className="icon-btn delete-btn"
                                            title="Eliminar"
                                            aria-label={`Eliminar ${product.name}`}
                                            onClick={() => handleDeleteClick(product.id)}
                                        >
                                            <Trash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="8" className="empty-state cell-empty">No se encontraron productos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    pageSize={pageSize}
                    pageSizeOptions={[5, 10, 20, 50, 100]}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {isModalOpen && (
                <ProductForm
                    product={editingProduct}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}

            {isCategoryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="categories-title">
                        <div className="modal-header">
                            <div>
                                <h2 id="categories-title">Gestionar Categorías</h2>
                                <p className="modal-subtitle">
                                    Activa o desactiva las categorías. Las categorías inactivas y sus productos no se mostrarán en la tienda web pública.
                                </p>
                            </div>
                            <button type="button" className="close-btn" onClick={() => setIsCategoryModalOpen(false)} aria-label="Cerrar">
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="search-field" style={{ marginBottom: 'var(--space-3)' }}>
                                <Search />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Buscar categoría..."
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                />
                            </div>
                            {filteredCategories.map((cat, i) => {
                                const name = typeof cat === 'object' ? cat.name : cat;
                                const isActive = typeof cat === 'object' ? cat.isActive : true;

                                return (
                                    <div key={i} className="toggle-row">
                                        <span className={isActive ? undefined : 'toggle-row__muted'}>{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleClick(name, isActive)}
                                            className={`badge badge-button ${isActive ? 'badge--success' : 'badge--danger'}`}
                                            title={isActive ? 'Desactivar' : 'Activar'}
                                        >
                                            {isActive ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </div>
                                );
                            })}
                            {categories.length === 0 && (
                                <div className="empty-state">No hay categorías disponibles</div>
                            )}
                            {categories.length > 0 && filteredCategories.length === 0 && (
                                <div className="empty-state">No hay resultados para tu búsqueda</div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setIsCategoryModalOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
