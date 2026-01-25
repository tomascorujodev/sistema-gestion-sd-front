import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User } from 'lucide-react';
import '../ProductForm.css'; // Reuse modal styles

export default function EmployeeSelector({ onSelect, onCancel }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);

    const [activeBranchShift, setActiveBranchShift] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchEmployees();
            await fetchActiveBranchShift();
            setLoading(false);
        };
        load();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('http://localhost:5027/api/employees');
            setEmployees(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchActiveBranchShift = async () => {
        try {
            const response = await axios.get('http://localhost:5027/api/shifts/current-branch');
            if (response.data && response.data.length > 0) {
                // Since we now enforce 1 shift per branch, take the first one
                setActiveBranchShift(response.data[0]);
                setSelectedId(response.data[0].employeeId);
            }
        } catch (err) {
            console.error("Error fetching branch status:", err);
        }
    };

    const handleConfirm = () => {
        if (!selectedId) {
            alert('Por favor seleccione un empleado');
            return;
        }
        const employee = employees.find(e => e.id === selectedId);
        onSelect(employee.id, employee.name);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Seleccionar Empleado</h2>
                    <button onClick={onCancel} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando empleados...</div>
                ) : (
                    <div style={{ padding: '1.5rem' }}>
                        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                            Seleccione qué empleado es usted para iniciar su turno:
                        </p>

                        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {employees.map((employee) => {
                                const isActive = activeBranchShift?.employeeId === employee.id;
                                const isLocked = activeBranchShift && !isActive;

                                return (
                                    <div
                                        key={employee.id}
                                        onClick={() => !isLocked && setSelectedId(employee.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            border: `2px solid ${selectedId === employee.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                            borderRadius: '0.5rem',
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                            backgroundColor: selectedId === employee.id ? '#eef2ff' : 'white',
                                            opacity: isLocked ? 0.6 : 1,
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: selectedId === employee.id ? 'var(--primary-color)' : '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: selectedId === employee.id ? 'white' : '#6b7280'
                                        }}>
                                            <User size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{employee.name}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                {employee.position}
                                                {isActive && (
                                                    <span style={{ marginLeft: '0.5rem', color: '#059669', fontWeight: 600 }}>
                                                        (Turno Activo)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedId === employee.id && (
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary-color)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {activeBranchShift && selectedId !== activeBranchShift.employeeId && (
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fef3c7',
                                borderRadius: '0.5rem',
                                color: '#92400e',
                                fontSize: '0.875rem',
                                marginBottom: '1rem'
                            }}>
                                ⚠️ Ya existe un turno activo de <strong>{activeBranchShift.employee?.name}</strong>.
                                Debe cerrarse antes de poder iniciar uno nuevo.
                            </div>
                        )}

                        {employees.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                                No se encontraron empleados activos. Por favor contacte a un administrador.
                            </p>
                        )}

                        <div className="modal-footer">
                            <button type="button" onClick={onCancel} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="btn btn-primary"
                                disabled={!selectedId || (activeBranchShift && selectedId !== activeBranchShift.employeeId)}
                            >
                                {activeBranchShift?.employeeId === selectedId ? 'Retomar Turno' : 'Iniciar Turno'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
