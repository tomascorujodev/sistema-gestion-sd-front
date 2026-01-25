import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, LogOut, CheckSquare, Tag, Clock, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import '../Layout.css';

import logo from '../assets/logo.png';

import ShiftReportModal from './ShiftReportModal';
import EmployeeSelector from './EmployeeSelector';
import ShiftAutoCloseNotification from './ShiftAutoCloseNotification';

export default function Layout() {
    const { logout, user, employee, activeShift, endShift, selectEmployee, checkingShift } = useAuth();
    const location = useLocation();
    const [shiftDuration, setShiftDuration] = useState('');

    useEffect(() => {
        if (!activeShift) {
            setShiftDuration('');
            return;
        }

        const updateDuration = () => {
            const start = new Date(activeShift.startTime);
            const now = new Date();
            const diff = now - start;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            setShiftDuration(`${hours}h ${minutes}m`);
        };

        updateDuration();
        const interval = setInterval(updateDuration, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [activeShift]);

    useEffect(() => {
        if (user && user.branch) {
            document.title = `Street Dog - ${user.branch}`;
        } else {
            document.title = 'Street Dog';
        }
    }, [user]);

    const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
    const [lastClosedShift, setLastClosedShift] = useState(null);
    const [lastEmployee, setLastEmployee] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });
    const [isCajaDropdownOpen, setIsCajaDropdownOpen] = useState(false);

    const handleEndShiftClick = () => {
        setShowEndShiftModal(true);
    };

    const handleConfirmEndShift = async () => {
        setLastEmployee(employee);
        setShowEndShiftModal(false);
        try {
            const result = await endShift();
            if (result && result !== false && result !== null) {
                setLastClosedShift(result);
                setShowReportModal(true);
            }
        } catch (error) {
            setErrorModal({ show: true, message: error.message });
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutModal(false);
    };

    const handleStartShiftClick = () => {
        setShowEmployeeSelector(true);
    };

    const handleEmployeeSelect = async (id, name) => {
        const success = await selectEmployee(id, name);
        if (success) {
            setShowEmployeeSelector(false);
        } else {
            alert("No se pudo iniciar el turno. Intente nuevamente.");
        }
    };

    return (
        <div className="layout-container">
            <ConfirmationModal
                isOpen={showEndShiftModal}
                onClose={() => setShowEndShiftModal(false)}
                onConfirm={handleConfirmEndShift}
                title="Finalizar Turno"
                message="¿Estás seguro de que quieres terminar tu turno? Se generará el reporte de cierre."
                confirmText="Finalizar"
                isDestructive={true}
            />
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
                title="Cerrar Sesión"
                message={user?.role === 'Admin'
                    ? "¿Estás seguro de que quieres cerrar sesión?"
                    : "¿Estás seguro de que quieres cerrar sesión? Si tienes un turno activo, este continuará contando."}
                confirmText="Cerrar Sesión"
                isDestructive={false}
            />
            <ConfirmationModal
                isOpen={errorModal.show}
                onClose={() => setErrorModal({ show: false, message: '' })}
                onConfirm={() => setErrorModal({ show: false, message: '' })}
                title="Error"
                message={errorModal.message}
                confirmText="Entendido"
                isDestructive={true}
                hideCancel={true}
            />
            <ShiftReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                shift={lastClosedShift}
                employee={lastEmployee}
            />
            {showEmployeeSelector && (
                <EmployeeSelector
                    onSelect={handleEmployeeSelect}
                    onCancel={() => setShowEmployeeSelector(false)}
                />
            )}
            <ShiftAutoCloseNotification />
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="Street Dog" style={{ maxWidth: '100%', height: 'auto', padding: '0.5rem' }} />
                    <p className="user-role" style={{ textTransform: 'capitalize' }}>
                        {user?.branch || user?.username || user?.role}
                    </p>
                    {employee ? (
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#eef2ff',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                {employee.name}
                            </div>
                            {shiftDuration && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', color: '#6b7280' }}>
                                    <Clock size={14} />
                                    <span>{shiftDuration}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        user?.role === 'Operator' && !checkingShift && (
                            <button
                                onClick={handleStartShiftClick}
                                className="btn btn-primary"
                                style={{
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    fontSize: '0.875rem',
                                    padding: '0.5rem'
                                }}
                            >
                                Iniciar Turno
                            </button>
                        )
                    )}
                </div>
                <nav className="sidebar-nav">
                    <Link to="/" className={isActive('/')}>
                        <LayoutDashboard size={20} />
                        <span>Inicio</span>
                    </Link>
                    <Link to="/products" className={isActive('/products')}>
                        <Package size={20} />
                        <span>Productos</span>
                    </Link>
                    {user?.role === 'Admin' && (
                        <Link to="/entities" className={isActive('/entities')}>
                            <Users size={20} />
                            <span>Gestión Entidades</span>
                        </Link>
                    )}
                    <Link to="/orders" className={isActive('/orders')}>
                        <ShoppingCart size={20} />
                        <span>Pedidos Proveedores</span>
                    </Link>
                    <Link to="/reports" className={isActive('/reports')}>
                        <FileText size={20} />
                        <span>Informes</span>
                    </Link>
                    <Link to="/promotions" className={isActive('/promotions')}>
                        <Tag size={20} />
                        <span>Promociones</span>
                    </Link>
                    {user?.role !== 'Admin' && (
                        <Link to="/cash-register" className={isActive('/cash-register')}>
                            <DollarSign size={20} />
                            <span>Cierre de Caja</span>
                        </Link>
                    )}
                    <Link to="/customer-orders" className={isActive('/customer-orders')}>
                        <Package size={20} />
                        <span>Pedidos Clientes</span>
                    </Link>
                    {user?.role !== 'Admin' && (
                        <Link to="/maintenance-operator" className={isActive('/maintenance-operator')}>
                            <CheckSquare size={20} />
                            <span>Mantenimiento</span>
                        </Link>
                    )}
                    {user?.role === 'Admin' && (
                        <>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <div
                                    onClick={() => setIsCajaDropdownOpen(!isCajaDropdownOpen)}
                                    className={`nav-item ${location.pathname.includes('/admin') || location.pathname.includes('/cash-register-log') ? 'active' : ''}`}
                                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <DollarSign size={20} />
                                        <span>Caja</span>
                                    </div>
                                    {isCajaDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                {isCajaDropdownOpen && (
                                    <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <Link
                                            to="/admin"
                                            className={location.pathname === '/admin' ? 'sub-nav-item active' : 'sub-nav-item'}
                                            style={{
                                                textDecoration: 'none',
                                                color: location.pathname === '/admin' ? 'var(--primary-color)' : '#6b7280',
                                                fontSize: '0.875rem',
                                                padding: '0.5rem',
                                                borderRadius: '0.375rem',
                                                background: location.pathname === '/admin' ? '#eef2ff' : 'transparent',
                                                display: 'block'
                                            }}
                                        >
                                            Historial de Caja
                                        </Link>
                                        <Link
                                            to="/cash-register-log"
                                            className={location.pathname === '/cash-register-log' ? 'sub-nav-item active' : 'sub-nav-item'}
                                            style={{
                                                textDecoration: 'none',
                                                color: location.pathname === '/cash-register-log' ? 'var(--primary-color)' : '#6b7280',
                                                fontSize: '0.875rem',
                                                padding: '0.5rem',
                                                borderRadius: '0.375rem',
                                                background: location.pathname === '/cash-register-log' ? '#eef2ff' : 'transparent',
                                                display: 'block'
                                            }}
                                        >
                                            Registro de Caja
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link to="/employees" className={isActive('/employees')}>
                                <Users size={20} />
                                <span>Empleados</span>
                            </Link>
                            <Link to="/maintenance" className={isActive('/maintenance')}>
                                <CheckSquare size={20} />
                                <span>Mantenimiento</span>
                            </Link>
                            <Link to="/branches" className={isActive('/branches')}>
                                <Users size={20} />
                                <span>Sucursales</span>
                            </Link>
                            <Link to="/design" className={isActive('/design')}>
                                <Package size={20} />
                                <span>Diseño Web</span>
                            </Link>
                        </>
                    )}
                </nav>
                <div className="sidebar-footer">
                    {employee && user?.role === 'Operator' && (
                        <button onClick={handleEndShiftClick} className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.5rem' }}>
                            Finalizar Turno
                        </button>
                    )}
                    <button onClick={handleLogoutClick} className="logout-btn">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
