import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, DollarSign, User, Tag, CreditCard, Users, Search, CheckCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css';

export default function CashRegisterLog() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [authorizers, setAuthorizers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        categoryId: '',
        accountId: '',
        authorizerId: '',
        supplierId: '',
        description: ''
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [successModal, setSuccessModal] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, catRes, accRes, authRes, suppRes] = await Promise.all([
                axios.get('http://localhost:5027/api/expenses'),
                axios.get('http://localhost:5027/api/referenceentities?type=Category'),
                axios.get('http://localhost:5027/api/referenceentities?type=Account'),
                axios.get('http://localhost:5027/api/referenceentities?type=Authorizer'),
                axios.get('http://localhost:5027/api/suppliers')
            ]);
            setExpenses(expRes.data);
            setCategories(catRes.data);
            setAccounts(accRes.data);
            setAuthorizers(authRes.data);
            setSuppliers(suppRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                amount: parseFloat(formData.amount),
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                accountId: formData.accountId ? parseInt(formData.accountId) : null,
                authorizerId: formData.authorizerId ? parseInt(formData.authorizerId) : null,
                supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
            };

            await axios.post('http://localhost:5027/api/expenses', expenseData);

            fetchData();
            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                categoryId: '',
                accountId: '',
                authorizerId: '',
                supplierId: '',
                description: ''
            });
            setSuccessModal({ show: true, message: 'Egreso registrado correctamente.' });
        } catch (err) {
            alert('Error al registrar egreso');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:5027/api/expenses/${deleteModal.id}`);
            setExpenses(expenses.filter(e => e.id !== deleteModal.id));
            setDeleteModal({ show: false, id: null });
        } catch (err) {
            alert('Error al eliminar registro');
        }
    };

    if (loading) return <div className="loading-container">Cargando registros...</div>;

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={handleDelete}
                title="Eliminar Registro"
                message="¿Está seguro de eliminar este registro?"
                confirmText="Eliminar"
                isDestructive={true}
            />

            <div className="page-header">
                <h1>Registro de Caja</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Registrar Egreso
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Rubro</th>
                            <th>Cuenta</th>
                            <th>Proveedor</th>
                            <th>Autorizante</th>
                            <th>Importe</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((item) => (
                            <tr key={item.id}>
                                <td>{new Date(item.date).toLocaleDateString('es-AR')}</td>
                                <td>
                                    {item.category && (
                                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                            {item.category.name}
                                        </span>
                                    )}
                                </td>
                                <td>{item.account?.name}</td>
                                <td>{item.supplier?.name}</td>
                                <td>{item.authorizer?.name}</td>
                                <td style={{ fontWeight: 600, color: '#dc2626' }}>
                                    -${item.amount.toFixed(2)}
                                </td>
                                <td>
                                    <button className="icon-btn delete-btn" onClick={() => setDeleteModal({ show: true, id: item.id })}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No hay egresos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2>Registrar Nuevo Egreso</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                {/* Financial Info */}
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Fecha <Calendar size={18} className="text-gray-500" /> <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Importe <DollarSign size={18} className="text-gray-500" /> <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="input-field"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Classification */}
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Rubro <Tag size={18} className="text-gray-500" />
                                    </label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Seleccionar Rubro</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Cuenta <CreditCard size={18} className="text-gray-500" />
                                    </label>
                                    <select
                                        value={formData.accountId}
                                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Seleccionar Cuenta</option>
                                        {accounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Entities */}
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Proveedor <Users size={18} className="text-gray-500" />
                                    </label>
                                    <select
                                        value={formData.supplierId}
                                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Seleccionar Proveedor</option>
                                        {suppliers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Autorizante <User size={18} className="text-gray-500" />
                                    </label>
                                    <select
                                        value={formData.authorizerId}
                                        onChange={(e) => setFormData({ ...formData, authorizerId: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Seleccionar Autorizante</option>
                                        {authorizers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Descripción / Observaciones</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field"
                                    rows="3"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {successModal.show && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="modal-body" style={{ padding: '3rem 2rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: '#dcfce7',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <CheckCircle size={40} color="#166534" />
                            </div>
                            <h2 style={{
                                margin: '0 0 0.5rem 0',
                                color: '#111827'
                            }}>
                                ¡Operación Exitosa!
                            </h2>
                            <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>
                                {successModal.message}
                            </p>
                            <button
                                onClick={() => setSuccessModal({ show: false, message: '' })}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: 'none'
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
