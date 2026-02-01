import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import '../Products.css';

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({ name: '', position: '', hourlyRate: '' });
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [payroll, setPayroll] = useState(null);
    const [activeShifts, setActiveShifts] = useState([]);

    // Shift Editing State
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [editingShiftId, setEditingShiftId] = useState(null);
    const [shiftFormData, setShiftFormData] = useState({ startTime: '', endTime: '', autoClosed: false });

    // Helper to format ISO date to datetime-local input format (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Ajustar a zona horaria local para el input
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const handleEditShift = (shift) => {
        setEditingShiftId(shift.id);
        setShiftFormData({
            startTime: formatDateForInput(shift.startTime),
            endTime: formatDateForInput(shift.endTime),
            autoClosed: shift.autoClosed || false
        });
        setIsShiftModalOpen(true);
    };

    const handleSaveShift = async (e) => {
        e.preventDefault();
        try {
            // Convert back to UTC ISO string
            const start = new Date(shiftFormData.startTime).toISOString();
            const end = new Date(shiftFormData.endTime).toISOString();

            await axios.put(`${import.meta.env.VITE_API_URL}/api/shifts/${editingShiftId}`, {
                startTime: start,
                endTime: end,
                autoClosed: shiftFormData.autoClosed
            });

            // Refresh payroll to show changes
            if (selectedEmployee) {
                fetchPayroll(selectedEmployee);
            }
            setIsShiftModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update shift');
        }
    };



    useEffect(() => {
        fetchEmployees();
        fetchActiveShifts();
    }, []);

    const fetchActiveShifts = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/current-branch`);
            setActiveShifts(response.data);
        } catch (err) {
            console.error("Error fetching active shifts:", err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/employees`);
            setEmployees(response.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const fetchPayroll = async (id) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/employees/${id}/payroll`);
            setPayroll(response.data);
            setSelectedEmployee(id);
        } catch (err) {
            alert('Failed to fetch payroll');
        }
    };

    const handleAdd = () => {
        setEditingEmployee(null);
        setFormData({ name: '', position: '', hourlyRate: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name,
            position: employee.position,
            hourlyRate: employee.hourlyRate
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                hourlyRate: parseFloat(formData.hourlyRate)
            };

            if (editingEmployee) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/employees/${editingEmployee.id}`, { ...data, id: editingEmployee.id });
                setEmployees(employees.map(e => e.id === editingEmployee.id ? { ...data, id: editingEmployee.id } : e));
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/employees`, data);
                setEmployees([...employees, response.data]);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert('Error al guardar el empleado');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres desactivar a este empleado?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/employees/${id}`);
                setEmployees(employees.filter(e => e.id !== id));
            } catch (err) {
                alert('Error al eliminar el empleado');
            }
        }
    };

    if (loading) return <div className="loading-container">Cargando empleados...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Gestión de Empleados</h1>
                <button className="btn btn-primary" onClick={handleAdd}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Agregar Empleado
                </button>
            </div>

            {/* Active Shifts Overview */}
            {/* Active Shifts Overview */}
            {activeShifts.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {activeShifts.map(shift => (
                            <div key={shift.id} style={{
                                backgroundColor: 'white',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid #10b981',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{shift.employee?.name || 'Empleado Desconocido'}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        Inicio: {new Date(shift.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Posición</th>
                                <th>Valor hora</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    style={{
                                        backgroundColor: selectedEmployee === employee.id ? '#eef2ff' : 'transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => fetchPayroll(employee.id)}
                                >
                                    <td>{employee.name}</td>
                                    <td>{employee.position}</td>
                                    <td>${employee.hourlyRate.toFixed(2)}/hr</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="icon-btn edit-btn"
                                                onClick={(e) => { e.stopPropagation(); handleEdit(employee); }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="icon-btn delete-btn"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(employee.id); }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                className="icon-btn"
                                                title="View Payroll"
                                                onClick={(e) => { e.stopPropagation(); fetchPayroll(employee.id); }}
                                            >
                                                <DollarSign size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {payroll && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0 }}>Horario - {payroll.name}</h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Horas Totales</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{payroll.totalHours.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Valor por hora</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>${payroll.hourlyRate.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Ganado</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#059669' }}>${payroll.totalEarned.toFixed(2)}</div>
                                </div>

                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Balance a pagar</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>${payroll.balance.toFixed(2)}</div>
                            </div>
                        </div>

                        <h4>Turnos recientes</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {payroll.shifts.map((shift) => (
                                <div key={shift.id} style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span>
                                            {new Date(shift.startTime).toLocaleDateString()} {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                        </span>
                                        {shift.autoClosed && <span style={{ marginLeft: '0.5rem', color: 'orange', fontWeight: 'bold' }}>(Auto-Cierre)</span>}
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            {shift.totalHours?.toFixed(2) || 0}h - ${shift.totalPay?.toFixed(2) || 0}
                                        </div>
                                    </div>
                                    {shift.endTime ? (
                                        <button
                                            className="icon-btn edit-btn"
                                            style={{ padding: '0.25rem' }}
                                            onClick={() => handleEditShift(shift)}
                                            title="Editar Turno"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                            onClick={async () => {
                                                if (window.confirm('¿Forzar el cierre de este turno ahora?')) {
                                                    try {
                                                        await axios.put(`${import.meta.env.VITE_API_URL}/api/shifts/${shift.id}`, {
                                                            startTime: shift.startTime,
                                                            endTime: new Date().toISOString(),
                                                            autoClosed: true
                                                        });
                                                        fetchPayroll(selectedEmployee);
                                                    } catch (err) {
                                                        alert('Error al cerrar el turno');
                                                    }
                                                }
                                            }}
                                        >
                                            Forzar Cierre
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>


                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingEmployee ? 'Editar Empleado' : 'Agregar Empleado'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Posición</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Valor hora</label>
                                <input
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                    step="0.01"
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isShiftModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Editar Turno</h2>
                            <button onClick={() => setIsShiftModalOpen(false)} className="close-btn">X</button>
                        </div>
                        <form onSubmit={handleSaveShift} className="modal-form">
                            <div className="form-group">
                                <label>Inicio del Turno</label>
                                <input
                                    type="datetime-local"
                                    value={shiftFormData.startTime}
                                    onChange={(e) => setShiftFormData({ ...shiftFormData, startTime: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fin del Turno</label>
                                <input
                                    type="datetime-local"
                                    value={shiftFormData.endTime}
                                    onChange={(e) => setShiftFormData({ ...shiftFormData, endTime: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={shiftFormData.autoClosed}
                                        onChange={(e) => setShiftFormData({ ...shiftFormData, autoClosed: e.target.checked })}
                                    />
                                    Marcado como Auto-Cierre
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsShiftModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
