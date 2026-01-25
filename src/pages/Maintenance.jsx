import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import '../Products.css';

export default function Maintenance() {
    const [tasks, setTasks] = useState([]);
    const [supplyRequests, setSupplyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [frequency, setFrequency] = useState('Daily');
    const [branch, setBranch] = useState('Ambas');

    const translateFrequency = (freq) => {
        const map = {
            'Daily': 'Diaria',
            'Weekly': 'Semanal',
            'Monthly': 'Mensual'
        };
        return map[freq] || freq;
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const [tasksRes, suppliesRes] = await Promise.all([
                axios.get('http://localhost:5027/api/maintenancetasks'),
                axios.get('http://localhost:5027/api/maintenancetasks/supplies')
            ]);
            setTasks(tasksRes.data);
            setSupplyRequests(suppliesRes.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5027/api/maintenancetasks', {
                description: newTask,
                frequency,
                isActive: true,
                branch: branch === 'Ambas' ? null : branch
            });
            setTasks([...tasks, response.data]);
            setNewTask('');
        } catch (err) {
            alert('Error al agregar la tarea');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5027/api/maintenancetasks/${id}`);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) {
            alert('Error al eliminar la tarea');
        }
    };

    const handleFulfillSupply = async (id) => {
        try {
            await axios.put(`http://localhost:5027/api/maintenancetasks/supplies/${id}/fulfill`);
            setSupplyRequests(supplyRequests.map(r => r.id === id ? { ...r, isFulfilled: true } : r));
        } catch (err) {
            alert('Error al marcar como cumplido');
        }
    };

    const handleDeleteSupply = async (id) => {
        if (!window.confirm('¿Eliminar esta solicitud?')) return;
        try {
            await axios.delete(`http://localhost:5027/api/maintenancetasks/supplies/${id}`);
            setSupplyRequests(supplyRequests.filter(r => r.id !== id));
        } catch (err) {
            alert('Error al eliminar solicitud');
        }
    };

    if (loading) return <div className="loading-container">Cargando tareas...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Tareas de Mantenimiento (Admin)</h1>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3>Agregar Nueva Tarea</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">Descripción</label>
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            required
                            className="input-field"
                            placeholder="ej. Limpiar jaulas"
                        />
                    </div>
                    <div style={{ width: '150px' }}>
                        <label className="input-label">Frecuencia</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="input-field"
                        >
                            <option value="Daily">Diaria</option>
                            <option value="Weekly">Semanal</option>
                            <option value="Monthly">Mensual</option>
                        </select>
                    </div>
                    <div style={{ width: '150px' }}>
                        <label className="input-label">Sucursal</label>
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="input-field"
                        >
                            <option value="Ambas">Ambas</option>
                            <option value="Independencia">Independencia</option>
                            <option value="Tucuman">Tucuman</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Agregar</button>
                </form>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>Frecuencia</th>
                            <th>Sucursal</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.id}>
                                <td>{task.description}</td>
                                <td>{translateFrequency(task.frequency)}</td>
                                <td>{task.branch || 'Ambas'}</td>
                                <td>{task.isActive ? 'Activo' : 'Inactivo'}</td>
                                <td>
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(task.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Solicitudes de Insumos</h2>
            <div className="table-container">
                <table className="data-table">

                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Detalle</th>
                            <th>Sucursal</th>
                            <th>Fecha Solicitud</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {supplyRequests.map((req) => (
                            <tr key={req.id} style={{ opacity: req.isFulfilled ? 0.6 : 1 }}>
                                <td>{req.itemName}</td>
                                <td>{req.details || '-'}</td>
                                <td>{req.branch || '-'}</td>
                                <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge ${req.isFulfilled ? 'success' : 'pending'}`}>
                                        {req.isFulfilled ? 'Comprado / Entregado' : 'Pendiente'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {!req.isFulfilled && (
                                            <button className="icon-btn success-btn" title="Marcar como Comprado" onClick={() => handleFulfillSupply(req.id)}>
                                                ✔️
                                            </button>
                                        )}
                                        <button className="icon-btn delete-btn" title="Eliminar" onClick={() => handleDeleteSupply(req.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {supplyRequests.length === 0 && (
                            <tr><td colSpan="6" className="text-center">No hay solicitudes pendientes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
