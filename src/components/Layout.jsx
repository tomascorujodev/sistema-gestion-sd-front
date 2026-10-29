import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Package, ShoppingCart, FileText, Users, LogOut, Tag, DollarSign,
    ChevronDown, Menu, X, CalendarClock, Building2, Globe, Wrench, Store,
    PanelLeftClose, PanelLeftOpen, TimerOff, Play, Gift
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import '../Layout.css';

import logo from '../assets/marca/logotipo.svg';
import isologo from '../assets/marca/isologotipo.svg';

import ShiftReportModal from './ShiftReportModal';
import EmployeeSelector from './EmployeeSelector';
import ShiftAutoCloseNotification from './ShiftAutoCloseNotification';

const COLLAPSED_KEY = 'sd.sidebarCollapsed';

function readCollapsed() {
    try {
        return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
        return false;
    }
}

function initials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// Los textos siempre se renderizan; el CSS los oculta en modo colapsado
// para que el ancho anime sin saltos.
function NavItem({ to, icon, label, active, collapsed }) {
    const Icon = icon;
    return (
        <Link
            to={to}
            className={`nav-item${active ? ' active' : ''}`}
            title={collapsed ? label : undefined}
            aria-current={active ? 'page' : undefined}
        >
            <Icon />
            <span className="nav-item__label">{label}</span>
        </Link>
    );
}

function NavGroup({ icon, label, items, pathname, collapsed, open, onToggle, onCollapsedClick }) {
    const Icon = icon;
    const childActive = items.some(item => item.to === pathname);
    const showItems = open && !collapsed;
    return (
        <div className="nav-group">
            <button
                type="button"
                className={`nav-item${childActive && !showItems ? ' active' : ''}${childActive ? ' nav-item--parent-active' : ''}`}
                onClick={collapsed ? onCollapsedClick : onToggle}
                aria-expanded={collapsed ? undefined : open}
                title={collapsed ? label : undefined}
            >
                <Icon />
                <span className="nav-item__label">{label}</span>
                <ChevronDown className={`nav-item__chevron${open ? '' : ' nav-item__chevron--closed'}`} />
            </button>
            {showItems && (
                <div className="nav-group__items">
                    {items.map(item => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`sub-nav-item${item.to === pathname ? ' active' : ''}`}
                            aria-current={item.to === pathname ? 'page' : undefined}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { logout, user, employee, activeShift, endShift, selectEmployee, checkingShift, isShiftsEnabled } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;
    const isAdmin = user?.role === 'Admin';
    const [shiftDuration, setShiftDuration] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(readCollapsed);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // En mobile el sidebar es un drawer y siempre se muestra expandido
    const collapsed = !isMobile && isCollapsed;

    const toggleCollapsed = () => {
        setIsCollapsed(prev => {
            try {
                localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1');
            } catch {
                // Sin storage: el estado vale solo para esta sesión
            }
            return !prev;
        });
    };

    // Cerrar el drawer al navegar
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location]);

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

    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
    const [lastClosedShift, setLastClosedShift] = useState(null);
    const [lastEmployee, setLastEmployee] = useState(null);
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });

    const webItems = [
        { to: '/products', label: 'Productos' },
        { to: '/clasificacion', label: 'Clasificación' },
        ...(isAdmin ? [
            { to: '/sucursales-web', label: 'Sucursales' },
            { to: '/promociones-web', label: 'Promociones' },
            { to: '/design', label: 'Diseño' }
        ] : []),
        { to: '/coupons', label: 'Cupones' },
        ...(isAdmin ? [{ to: '/shipping', label: 'Envíos' }] : [])
    ];
    const fidelizacionItems = [
        { to: '/fidelizacion', label: 'Mostrador' },
        { to: '/fidelizacion/clientes', label: 'Clientes' },
        { to: '/fidelizacion/movimientos', label: 'Movimientos' },
        { to: '/fidelizacion/canjes', label: 'Canjes' },
        ...(isAdmin ? [
            { to: '/fidelizacion/catalogo', label: 'Catálogo' },
            { to: '/fidelizacion/configuracion', label: 'Configuración' }
        ] : [])
    ];
    const cajaItems = [
        { to: '/admin', label: 'Historial de Caja' },
        { to: '/cash-register-log', label: 'Registro de Caja' }
    ];

    // Los grupos arrancan abiertos si la ruta actual está dentro de ellos
    const [isWebOpen, setIsWebOpen] = useState(() => webItems.some(i => i.to === pathname));
    const [isCajaOpen, setIsCajaOpen] = useState(() => cajaItems.some(i => i.to === pathname));
    const [isFidelizacionOpen, setIsFidelizacionOpen] = useState(() => fidelizacionItems.some(i => i.to === pathname));

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

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutModal(false);
    };

    const handleEmployeeSelect = async (id, name) => {
        const success = await selectEmployee(id, name);
        if (success) {
            setShowEmployeeSelector(false);
        } else {
            alert("No se pudo iniciar el turno. Intente nuevamente.");
        }
    };

    const branchName = user?.branch || user?.username || user?.role;
    const showShiftCard = employee && isShiftsEnabled;
    const showStartShift = !employee && user?.role === 'Operator' && !checkingShift && isShiftsEnabled;

    return (
        <div className={`layout-container${collapsed ? ' layout-container--collapsed' : ''}`}>
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
                message={isAdmin
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

            {/* Barra superior (solo mobile) */}
            <header className="mobile-topbar">
                <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Abrir menú"
                >
                    <Menu />
                </button>
                <Link to="/" className="mobile-topbar__brand">
                    <img src={logo} alt="Street Dog" />
                </Link>
                {showShiftCard && (
                    <span className="shift-chip" title={`Turno de ${employee.name}`}>
                        <span className="avatar avatar--sm">{initials(employee.name)}</span>
                        <span className="status-dot" />
                        {shiftDuration}
                    </span>
                )}
            </header>

            {isMobile && isDrawerOpen && (
                <div className="sidebar-overlay" onClick={() => setIsDrawerOpen(false)} />
            )}

            <aside className={`sidebar${collapsed ? ' collapsed' : ''}${isDrawerOpen ? ' open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-brand" title="Street Dog">
                        <img src={isologo} alt="" className="sidebar-brand__isologo" aria-hidden="true" />
                        <span className="sidebar-brand__text">
                            <img src={logo} alt="Street Dog" className="sidebar-brand__logo" />
                            <span className="user-role">{branchName}</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        className="icon-btn sidebar-close"
                        onClick={() => setIsDrawerOpen(false)}
                        aria-label="Cerrar menú"
                    >
                        <X />
                    </button>
                </div>

                {showShiftCard && (
                    <div className="shift-card" title={collapsed ? `${employee.name} · ${shiftDuration}` : undefined}>
                        <span className="avatar">
                            {initials(employee.name)}
                            <span className="avatar__status" />
                        </span>
                        <div className="shift-card__info">
                            <div className="shift-card__name">{employee.name}</div>
                            <div className="shift-card__time">
                                Turno activo{shiftDuration && ` · ${shiftDuration}`}
                            </div>
                        </div>
                    </div>
                )}

                {showStartShift && (
                    <div className="sidebar-cta">
                        <button
                            onClick={() => setShowEmployeeSelector(true)}
                            className="btn btn-primary btn-block"
                            title={collapsed ? 'Iniciar Turno' : undefined}
                        >
                            <Play />
                            <span className="sidebar-cta__label">Iniciar Turno</span>
                        </button>
                    </div>
                )}

                <nav className="sidebar-nav">
                    <NavItem to="/" icon={LayoutDashboard} label="Inicio" active={pathname === '/'} collapsed={collapsed} />
                    {isAdmin && (
                        <NavItem to="/entities" icon={Building2} label="Gestión Entidades" active={pathname === '/entities'} collapsed={collapsed} />
                    )}
                    <NavItem to="/suppliers" icon={ShoppingCart} label="Proveedores" active={pathname === '/suppliers'} collapsed={collapsed} />
                    <NavItem to="/vencimientos" icon={CalendarClock} label="Vencimientos" active={pathname === '/vencimientos'} collapsed={collapsed} />
                    <NavItem to="/reports" icon={FileText} label="Informes" active={pathname === '/reports'} collapsed={collapsed} />
                    <NavItem to="/promotions" icon={Tag} label="Promociones" active={pathname === '/promotions'} collapsed={collapsed} />

                    {/* Operator Only Links */}
                    {!isAdmin && (
                        <NavItem to="/cash-register" icon={DollarSign} label="Cierre de Caja" active={pathname === '/cash-register'} collapsed={collapsed} />
                    )}
                    <NavItem to="/customer-orders" icon={Package} label="Pedidos Clientes" active={pathname === '/customer-orders'} collapsed={collapsed} />
                    <NavGroup
                        icon={Gift}
                        label="Fidelización"
                        items={fidelizacionItems}
                        pathname={pathname}
                        collapsed={collapsed}
                        open={isFidelizacionOpen}
                        onToggle={() => setIsFidelizacionOpen(!isFidelizacionOpen)}
                        onCollapsedClick={() => navigate('/fidelizacion')}
                    />
                    {!isAdmin && (
                        <NavItem to="/maintenance-operator" icon={Wrench} label="Mantenimiento" active={pathname === '/maintenance-operator'} collapsed={collapsed} />
                    )}
                    <NavItem to="/mi-vet-shop" icon={FileText} label="Mi Vet Shop" active={pathname === '/mi-vet-shop'} collapsed={collapsed} />

                    <NavGroup
                        icon={Globe}
                        label="Página Web"
                        items={webItems}
                        pathname={pathname}
                        collapsed={collapsed}
                        open={isWebOpen}
                        onToggle={() => setIsWebOpen(!isWebOpen)}
                        onCollapsedClick={() => navigate('/products')}
                    />

                    {isAdmin && (
                        <>
                            <div className="nav-section-label">
                                <span>Administración</span>
                            </div>
                            <NavGroup
                                icon={DollarSign}
                                label="Caja"
                                items={cajaItems}
                                pathname={pathname}
                                collapsed={collapsed}
                                open={isCajaOpen}
                                onToggle={() => setIsCajaOpen(!isCajaOpen)}
                                onCollapsedClick={() => navigate('/admin')}
                            />
                            <NavItem to="/employees" icon={Users} label="Empleados" active={pathname === '/employees'} collapsed={collapsed} />
                            <NavItem to="/maintenance" icon={Wrench} label="Mantenimiento" active={pathname === '/maintenance'} collapsed={collapsed} />
                            <NavItem to="/branches" icon={Store} label="Sucursales" active={pathname === '/branches'} collapsed={collapsed} />
                        </>
                    )}
                </nav>

                {/* Footer con alto fijo: el botón de colapsar queda siempre abajo de todo, en el mismo lugar */}
                <div className="sidebar-footer">
                    {employee && user?.role === 'Operator' && isShiftsEnabled && (
                        <button
                            type="button"
                            onClick={() => setShowEndShiftModal(true)}
                            className="nav-item"
                            title={collapsed ? 'Finalizar Turno' : undefined}
                        >
                            <TimerOff />
                            <span className="nav-item__label">Finalizar Turno</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="nav-item"
                        title={collapsed ? 'Cerrar Sesión' : undefined}
                    >
                        <LogOut />
                        <span className="nav-item__label">Cerrar Sesión</span>
                    </button>
                    <button
                        type="button"
                        className="nav-item sidebar-toggle"
                        onClick={toggleCollapsed}
                        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                        aria-expanded={!collapsed}
                        title={collapsed ? 'Expandir menú' : undefined}
                    >
                        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                        <span className="nav-item__label">Colapsar menú</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
