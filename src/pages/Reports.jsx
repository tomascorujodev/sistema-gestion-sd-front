import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, Filter, ChevronDown, ChevronUp, DollarSign, AlertCircle, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../Products.css';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedReportId, setExpandedReportId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(7);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        fetchReports();
    }, [currentPage, pageSize]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dailyreports?page=${currentPage}&pageSize=${pageSize}`);
            setReports(response.data.data || response.data);
            if (response.data.pagination) {
                setTotalPages(response.data.pagination.totalPages);
                setTotalRecords(response.data.pagination.totalRecords);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedReportId(expandedReportId === id ? null : id);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setExpandedReportId(null); // Collapse any expanded report when changing pages
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing page size
        setExpandedReportId(null);
    };

    if (loading) return <div className="loading-container">Cargando informes...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Historial de Informes</h1>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {totalRecords} {totalRecords === 1 ? 'informe' : 'informes'} en total
                </div>
            </div>

            <div className="reports-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.map((report) => (
                    <div key={report.id} style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        {/* Header Row */}
                        <div
                            onClick={() => toggleExpand(report.id)}
                            style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: expandedReportId === report.id ? '#f8fafc' : 'white',
                                borderBottom: expandedReportId === report.id ? '1px solid #e2e8f0' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px' }}>
                                    <div style={{ background: '#e0e7ff', padding: '0.5rem', borderRadius: '50%', color: '#4f46e5' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                            {new Date(report.date).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {new Date(report.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                                        </div>
                                    </div>
                                </div>

                                <div style={{ width: '150px' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>Usuario</span>
                                    <span style={{ fontWeight: 500 }}>{report.user?.username || 'Desconocido'}</span>
                                </div>

                                <div style={{ width: '120px' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>Ventas</span>
                                    <span style={{ fontWeight: 600, color: '#059669' }}>${report.totalSales?.toLocaleString('es-AR') || '0'}</span>
                                </div>

                                {report.complaints && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', background: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                                        <AlertCircle size={14} /> Con Quejas
                                    </div>
                                )}
                            </div>

                            <div>
                                {expandedReportId === report.id ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedReportId === report.id && (
                            <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                                    {/* Full Text Report */}
                                    <div>
                                        <h4 style={{ marginTop: 0, color: '#475569', marginBottom: '0.5rem' }}>Reporte Completo</h4>
                                        <div style={{
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: 'monospace',
                                            background: 'white',
                                            padding: '1rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.5,
                                            color: '#334155'
                                        }}>
                                            {report.shiftData}
                                        </div>
                                    </div>

                                    {/* Structured Data / Sidebar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertCircle size={16} /> Quejas/Reclamos
                                            </h5>
                                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{report.complaints || 'Ninguna registrada'}</p>
                                        </div>

                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Package size={16} /> Novedades Stock
                                            </h5>
                                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{report.stockCheck || 'Sin novedades'}</p>
                                        </div>

                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <DollarSign size={16} /> Rebotes
                                            </h5>
                                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{report.bounces || 'Ninguno'}</p>
                                        </div>

                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>Mantenimiento</h5>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: report.maintenanceTasksCompleted ? '#22c55e' : '#f59e0b' }}></div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {report.maintenanceTasksCompleted ? 'Tareas Completadas' : 'Tareas Incompletas'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {reports.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '0.5rem' }}>
                        No hay informes registrados aún.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalRecords > 0 && (
                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
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
                            <option value={7}>7</option>
                            <option value={14}>14</option>
                            <option value={28}>28</option>
                        </select>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>por página</span>
                    </div>

                    {/* Page Info */}
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Página {currentPage} de {totalPages}
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: currentPage === 1 ? '#f1f5f9' : 'white',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: currentPage === 1 ? 0.5 : 1
                            }}
                            title="Primera página"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: currentPage === 1 ? '#f1f5f9' : 'white',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: currentPage === 1 ? 0.5 : 1
                            }}
                            title="Página anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: currentPage === totalPages ? 0.5 : 1
                            }}
                            title="Página siguiente"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0',
                                background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: currentPage === totalPages ? 0.5 : 1
                            }}
                            title="Última página"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
