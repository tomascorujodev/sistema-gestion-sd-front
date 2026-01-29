import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Key, User } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css'; // Reuse common styles

export default function Branches() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notification, setNotification] = useState({ show: false, title: '', message: '', isError: false });

    // Form Data
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'Operator',
        branch: 'Sucursal Principal'
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar usuarios');
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, newUser);
            setNotification({ show: true, title: 'Éxito', message: 'Usuario creado correctamente', isError: false });
            setIsAddModalOpen(false);
            setNewUser({ username: '', password: '', role: 'Operator', branch: 'Sucursal Principal' });
            fetchUsers();
        } catch (err) {
            console.error(err);
            setNotification({ show: true, title: 'Error', message: 'Error al crear usuario: ' + (err.response?.data || err.message), isError: true });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setNotification({ show: true, title: 'Error', message: 'Las contraseñas no coinciden', isError: true });
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${selectedUser.id}/password`,
                JSON.stringify(passwordData.newPassword),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setNotification({ show: true, title: 'Éxito', message: 'Contraseña actualizada correctamente', isError: false });
            setIsPasswordModalOpen(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setSelectedUser(null);
        } catch (err) {
            console.error(err);
            setNotification({ show: true, title: 'Error', message: 'Error al actualizar contraseña', isError: true });
        }
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setIsPasswordModalOpen(true);
    };

    if (loading) return <div className="loading-container">Cargando sucursales...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={notification.show}
                onClose={() => setNotification({ ...notification, show: false })}
                onConfirm={() => setNotification({ ...notification, show: false })}
                title={notification.title}
                message={notification.message}
                confirmText="Aceptar"
                isDestructive={false}
                hideCancel={true}
            />
            <div className="page-header">
                <h1>Sucursales / Usuarios</h1>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Nueva Sucursal
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Sucursal Asignada</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '50%' }}>
                                            <User size={16} color="#64748b" />
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{user.username}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.role?.toLowerCase() || 'operator'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.branch || '-'}</td>
                                <td>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        onClick={() => openPasswordModal(user)}
                                    >
                                        <Key size={14} />
                                        Cambiar Clave
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Nueva Sucursal / Usuario</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleAddUser} className="modal-form">
                            <div className="form-group">
                                <label>Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                    className="input-field"
                                    placeholder="Ej. Independencia"
                                />
                            </div>
                            <div className="form-group">
                                <label>Contraseña Inicial</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Operator">Operador (Vendedor)</option>
                                    <option value="Admin">Administrador</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Sucursal (Para informes)</label>
                                <select
                                    value={newUser.branch}
                                    onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Sucursal Principal">Sucursal Principal</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="Tucuman">Tucumán</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Crear Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Cambiar Contraseña</h2>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Usuario: {selectedUser.username}</p>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleChangePassword} className="modal-form">
                            <div className="form-group">
                                <label>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Actualizar Clave</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
