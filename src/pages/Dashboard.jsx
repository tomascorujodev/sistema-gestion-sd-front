import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User, DollarSign, Package, AlertCircle, Wrench, TrendingUp, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../Products.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [branchStatus, setBranchStatus] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKpis();
        const interval = setInterval(fetchKpis, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (user?.role === 'Admin') {
            fetchBranchStatus();
            const interval = setInterval(fetchBranchStatus, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchKpis = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/kpis`);
            setKpis(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching KPIs:', err);
            setLoading(false);
        }
    };

    const fetchBranchStatus = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/dashboard`);
            setBranchStatus(response.data);
        } catch (err) {
            console.error('Error fetching branch status:', err);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    if (loading) return <div className="loading-container">Cargando tablero...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Inicio</h1>
                <p>Bienvenido, {user?.username}</p>
            </div>

            {/* KPI Cards */}
            {kpis && (
                <>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#475569' }}>
                            {kpis.activeShift ? `Métricas del Turno Actual` : 'Métricas del Día'}
                        </h2>
                        {kpis.activeShift && (
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Turno de {kpis.activeShift.employeeName} desde {formatTime(kpis.activeShift.startTime)}
                                {!kpis.activeShift.hasCashRegister && (
                                    <span style={{ marginLeft: '0.5rem', color: '#dc2626', fontWeight: 600 }}>
                                        ⚠️ Sin cierre de caja
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {/* Total Sales */}
                        <div style={{ background: '#9D3E3C', borderRadius: '0.75rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ventas Totales</span>
                                <DollarSign size={24} style={{ opacity: 0.8 }} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(kpis.totalSales)}</div>
                        </div>

                        {/* Pending Orders */}
                        <div style={{ background: '#373435', borderRadius: '0.75rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pedidos Pendientes</span>
                                <Package size={24} style={{ opacity: 0.8 }} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpis.pendingOrders}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                {kpis.completedOrders} entregados hoy
                            </div>
                        </div>

                        {/* Pending Maintenance */}
                        <div style={{ background: '#64748b', borderRadius: '0.75rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Tareas Pendientes</span>
                                <Wrench size={24} style={{ opacity: 0.8 }} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpis.pendingMaintenance.length}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                Mantenimiento
                            </div>
                        </div>

                        {/* Supplier Orders */}
                        {user?.role === 'Admin' && (
                            <>
                                <div style={{ background: '#7a2e2c', borderRadius: '0.75rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pedidos Proveedores</span>
                                        <ShoppingCart size={24} style={{ opacity: 0.8 }} />
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{kpis.pendingSupplierOrders}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                        En tránsito
                                    </div>
                                </div>

                                {/* Uncontrolled Money */}
                                <div style={{ background: '#fff7ed', borderRadius: '0.75rem', padding: '1.5rem', color: '#ea580c', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #fed7aa' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', opacity: 0.9, fontWeight: 600 }}>Sobres No Controlados</span>
                                        <DollarSign size={24} style={{ opacity: 0.8 }} />
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(kpis.uncontrolledSum || 0)}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                                        Requiere revisión
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Maintenance Tasks List */}
                    {kpis.pendingMaintenance.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={20} color="#f59e0b" />
                                Tareas de Mantenimiento Pendientes
                            </h3>
                            <div style={{ background: 'white', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                {kpis.pendingMaintenance.map((task, index) => (
                                    <div
                                        key={task.id}
                                        style={{
                                            padding: '1rem 1.25rem',
                                            borderBottom: index < kpis.pendingMaintenance.length - 1 ? '1px solid #e5e7eb' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                                                {task.description}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                Frecuencia: {task.frequency === 'Daily' ? 'Diaria' : task.frequency === 'Weekly' ? 'Semanal' : 'Mensual'}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: task.frequency === 'Daily' ? '#fee2e2' : task.frequency === 'Weekly' ? '#fef3c7' : '#e0e7ff',
                                                color: task.frequency === 'Daily' ? '#991b1b' : task.frequency === 'Weekly' ? '#92400e' : '#3730a3'
                                            }}>
                                                {task.frequency === 'Daily' ? '🔴 Diaria' : task.frequency === 'Weekly' ? '🟡 Semanal' : '🔵 Mensual'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Admin: Branch Status */}
            {user?.role === 'Admin' && branchStatus.length > 0 && (
                <>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#475569' }}>Estado de Sucursales</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {branchStatus.map((branch, index) => (
                            <div key={index} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                                    {branch.branchName || 'Sucursal Sin Nombre'}
                                </h3>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase' }}>
                                        <Clock size={16} color="#059669" />
                                        Turno Actual
                                    </div>
                                    {branch.activeShift ? (
                                        <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#064e3b', fontSize: '1.1rem' }}>
                                                <User size={18} />
                                                {branch.activeShift.employeeName}
                                            </div>
                                            <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#047857' }}>
                                                Inició: {formatTime(branch.activeShift.startTime)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#64748b', fontStyle: 'italic' }}>
                                            Cerrado
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase' }}>
                                        <TrendingUp size={16} />
                                        Último Turno
                                    </div>
                                    {branch.lastClosedShift ? (
                                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#f1f5f9' }}>
                                            <div style={{ fontWeight: 600, color: '#334155' }}>
                                                {branch.lastClosedShift.employeeName}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.85rem', color: '#475569' }}>
                                                <span>Cierre: {formatTime(branch.lastClosedShift.endTime)}</span>
                                                <span>{branch.lastClosedShift.totalHours?.toFixed(1)} hrs</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sin registros previos</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
