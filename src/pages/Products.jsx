import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Plus, Edit, Trash2, Upload, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, ImageOff, Loader, Search,
    Tag, Eye, EyeOff, Package
} from 'lucide-react';
import ProductForm from '../components/ProductForm';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css';

export default function Products() {
    // -- Tab --
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'

    // -- Products state --
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [cleanupModal, setCleanupModal] = useState({ show: false });
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState(null);

    // -- Categories state --
    const [categories, setCategories] = useState([]); // [{name, isActive}]
    const [togglingCategory, setTogglingCategory] = useState(null);
    const [categoryConfirm, setCategoryConfirm] = useState({ show: false, category: null });

    // Debounce for search
    const searchTimeout = useRef(null);

    const handleSearchInputChange = (e) => {
        const val = e.target.value;
        setSearchInput(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setSearchQuery(val);
            setPage(1);
        }, 350);
    };

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
                    category: categoryFilter || undefined,
                    search: searchQuery || undefined
                }
            });
            setProducts(response.data.items || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalCount || 0);
            setLoading(false);
        } catch (err) {
            console.error('Error loading products:', err);
            setError('Error al cargar productos');
            setProducts([]);
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
                await fetchProducts();
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
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchProducts();
            await fetchCategories();
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
            event.target.value = null;
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
            fetchProducts();
            fetchCategories();
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
        setPage(1);
    };

    // -- Category toggle --
    const handleToggleCategory = async (categoryName) => {
        setTogglingCategory(categoryName);
        try {
            const encoded = encodeURIComponent(categoryName);
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/products/categories/${encoded}/toggle`
            );
            setCategories(prev =>
                prev.map(c =>
                    c.name === categoryName
                        ? { ...c, isActive: response.data.isActive }
                        : c
                )
            );
        } catch (err) {
            console.error('Error toggling category:', err);
            setInfoModal({
                show: true,
                title: 'Error',
                message: 'No se pudo cambiar el estado de la categoría.',
                isError: true
            });
        } finally {
            setTogglingCategory(null);
            setCategoryConfirm({ show: false, category: null });
        }
    };

    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            {/* Modals */}
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
            <ConfirmationModal
                isOpen={cleanupModal.show}
                onClose={() => setCleanupModal({ show: false })}
                onConfirm={handleCleanupBrokenImages}
                title="Limpiar imágenes rotas"
                message="Este proceso revisará todos los productos con imagen y eliminará las referencias a imágenes que ya no existen en Cloudinary. Las imágenes válidas no serán afectadas. ¿Desea continuar?"
                confirmText="Limpiar"
                isDestructive={false}
            />
            {/* Category toggle confirm */}
            <ConfirmationModal
                isOpen={categoryConfirm.show}
                onClose={() => setCategoryConfirm({ show: false, category: null })}
                onConfirm={() => handleToggleCategory(categoryConfirm.category?.name)}
                title={categoryConfirm.category?.isActive ? 'Ocultar Categoría en la Web' : 'Mostrar Categoría en la Web'}
                message={
                    categoryConfirm.category?.isActive
                        ? `¿Deseas ocultar la categoría "${categoryConfirm.category?.name}" de la página web? Los productos de esta categoría dejarán de verse.`
                        : `¿Deseas volver a mostrar la categoría "${categoryConfirm.category?.name}" en la página web?`
                }
                confirmText={categoryConfirm.category?.isActive ? 'Ocultar' : 'Mostrar'}
                isDestructive={categoryConfirm.category?.isActive}
            />

            {/* Cleanup result modal */}
            {cleanupResult && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '0.75rem', padding: '2rem',
                        maxWidth: '520px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1e293b' }}>Limpieza completada</h2>
                        <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
                            Se revisaron <strong>{cleanupResult.checkedCount}</strong> productos con imagen.
                        </p>
                        {cleanupResult.cleanedCount === 0 ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem', color: '#166534', fontSize: '0.9rem' }}>
                                ✅ ¡Todo en orden! No se encontraron imágenes rotas.
                            </div>
                        ) : (
                            <>
                                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#92400e', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    ⚠️ Se limpiaron <strong>{cleanupResult.cleanedCount}</strong> imágenes rotas.
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                                    {cleanupResult.cleanedProducts.map((p, i) => (
                                        <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                                            <strong>{p.name}</strong>
                                            <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem' }}>ID #{p.id}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setCleanupResult(null)}>Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <h1>Productos</h1>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Gestioná el catálogo y la visibilidad en la web
                </div>
                <div className="header-actions" style={{ marginTop: '1rem' }}>
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
                        style={{ marginRight: '0.75rem', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center' }}
                    >
                        {cleanupLoading
                            ? <Loader size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                            : <ImageOff size={16} style={{ marginRight: '0.5rem' }} />
                        }
                        {cleanupLoading ? 'Verificando...' : 'Limpiar imágenes rotas'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleImportClick}
                        style={{ marginRight: '0.75rem', backgroundColor: '#28a745', color: 'white' }}
                    >
                        <Upload size={16} style={{ marginRight: '0.5rem' }} />
                        Importar Excel
                    </button>
                    <button className="btn btn-primary" onClick={handleAdd}>
                        <Plus size={16} style={{ marginRight: '0.5rem' }} />
                        Agregar Producto
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'products' ? '700' : '400',
                        borderBottom: activeTab === 'products' ? '3px solid #3b82f6' : '3px solid transparent',
                        color: activeTab === 'products' ? '#3b82f6' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        marginBottom: '-2px',
                        transition: 'all 0.15s'
                    }}
                >
                    <Package size={16} />
                    Productos
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'categories' ? '700' : '400',
                        borderBottom: activeTab === 'categories' ? '3px solid #3b82f6' : '3px solid transparent',
                        color: activeTab === 'categories' ? '#3b82f6' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.95rem',
                        marginBottom: '-2px',
                        transition: 'all 0.15s'
                    }}
                >
                    <Tag size={16} />
                    Categorías
                    <span style={{
                        background: categories.filter(c => !c.isActive).length > 0 ? '#fef3c7' : '#e2e8f0',
                        color: categories.filter(c => !c.isActive).length > 0 ? '#92400e' : '#64748b',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.5rem',
                        fontWeight: '700'
                    }}>
                        {categories.filter(c => !c.isActive).length > 0
                            ? `${categories.filter(c => !c.isActive).length} oculta${categories.filter(c => !c.isActive).length > 1 ? 's' : ''}`
                            : categories.length
                        }
                    </span>
                </button>
            </div>

            {/* ===================== PRODUCTS TAB ===================== */}
            {activeTab === 'products' && (
                <>
                    {/* Filters row */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search input */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            background: 'white',
                            flex: '1',
                            minWidth: '200px',
                            maxWidth: '360px'
                        }}>
                            <Search size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o SKU..."
                                value={searchInput}
                                onChange={handleSearchInputChange}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '0.9rem',
                                    color: '#1e293b'
                                }}
                            />
                            {searchInput && (
                                <button
                                    onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center'
                                    }}
                                    title="Limpiar búsqueda"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category filter */}
                        <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', minWidth: '180px' }}
                        >
                            <option value="">Todas las Categorías</option>
                            {categories.map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>

                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: 'auto' }}>
                            {totalRecords} {totalRecords === 1 ? 'producto' : 'productos'} en total
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">Cargando productos...</div>
                    ) : (
                        <>
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
                                                <td>
                                                    {product.category}
                                                    {categories.find(c => c.name === product.category && !c.isActive) && (
                                                        <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: '600' }}>
                                                            Oculta
                                                        </span>
                                                    )}
                                                </td>
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
                                                <td colSpan="8" className="text-center">
                                                    {searchQuery
                                                        ? `No se encontraron productos para "${searchQuery}".`
                                                        : 'No se encontraron productos.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalRecords > 0 && (
                                <div className="pagination-controls">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</label>
                                        <select
                                            value={pageSize}
                                            onChange={handlePageSizeChange}
                                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', cursor: 'pointer', background: 'white' }}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>por página</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Página {page} de {totalPages}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[
                                            { icon: <ChevronsLeft size={18} />, page: 1, title: 'Primera página' },
                                            { icon: <ChevronLeft size={18} />, page: page - 1, title: 'Página anterior' },
                                            { icon: <ChevronRight size={18} />, page: page + 1, title: 'Página siguiente' },
                                            { icon: <ChevronsRight size={18} />, page: totalPages, title: 'Última página' },
                                        ].map(({ icon, page: target, title }, i) => {
                                            const disabled = target < 1 || target > totalPages || target === page;
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handlePageChange(target)}
                                                    disabled={disabled}
                                                    title={title}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '0.375rem',
                                                        border: '1px solid #e2e8f0',
                                                        background: disabled ? '#f1f5f9' : 'white',
                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        opacity: disabled ? 0.5 : 1
                                                    }}
                                                >
                                                    {icon}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ===================== CATEGORIES TAB ===================== */}
            {activeTab === 'categories' && (
                <div>
                    <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.5rem',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem',
                        color: '#1e40af',
                        fontSize: '0.9rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                    }}>
                        <Eye size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <div>
                            <strong>Visibilidad en la web pública.</strong> Al desactivar una categoría, todos sus productos dejan de aparecer en la página web, aunque estén activos individualmente. Los cambios son inmediatos.
                        </div>
                    </div>

                    {categories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No hay categorías registradas aún.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {categories.map(cat => (
                                <div
                                    key={cat.name}
                                    style={{
                                        background: cat.isActive ? 'white' : '#fafafa',
                                        border: cat.isActive ? '1px solid #e2e8f0' : '1px solid #fca5a5',
                                        borderRadius: '0.75rem',
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'box-shadow 0.15s',
                                        boxShadow: cat.isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                        opacity: cat.isActive ? 1 : 0.8
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '0.5rem',
                                            background: cat.isActive ? '#dbeafe' : '#fee2e2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Tag size={16} color={cat.isActive ? '#2563eb' : '#dc2626'} />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                color: '#1e293b',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {cat.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                marginTop: '0.15rem',
                                                fontWeight: '600',
                                                color: cat.isActive ? '#16a34a' : '#dc2626'
                                            }}>
                                                {cat.isActive ? '✓ Visible en la web' : '✗ Oculta en la web'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setCategoryConfirm({ show: true, category: cat })}
                                        disabled={togglingCategory === cat.name}
                                        title={cat.isActive ? 'Ocultar en la web' : 'Mostrar en la web'}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: 'none',
                                            cursor: togglingCategory === cat.name ? 'wait' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            whiteSpace: 'nowrap',
                                            background: cat.isActive ? '#fee2e2' : '#dcfce7',
                                            color: cat.isActive ? '#991b1b' : '#166534',
                                            transition: 'opacity 0.15s',
                                            opacity: togglingCategory === cat.name ? 0.6 : 1,
                                            flexShrink: 0
                                        }}
                                    >
                                        {togglingCategory === cat.name ? (
                                            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        ) : cat.isActive ? (
                                            <EyeOff size={14} />
                                        ) : (
                                            <Eye size={14} />
                                        )}
                                        {cat.isActive ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
