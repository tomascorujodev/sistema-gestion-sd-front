import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckSquare } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import '../Products.css';

export default function MaintenanceOperator() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState({
        item: '',
        details: '',
        branch: 'Sucursal Principal'
    });
    const [infoModal, setInfoModal] = useState({ show: false, title: '', message: '', isError: false });

    const suppliesList = [
        "Secador de Piso", "Escoba", "Pala", "Detergente",
        "Desodorante de piso", "Blem", "Limpia vidrios",
        "Trapo de piso", "Trapos para gondolas y mostrador",
        "Desodorante de ambiente", "Otro"
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenancetasks`);
            setTasks(response.data.filter(t => t.isActive));
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleRequest = async (e) => {
        e.preventDefault();
        if (!request.item) {
            alert("Seleccione un insumo");
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenancetasks/supplies`, {
                itemName: request.item,
                details: request.item === 'Otro' ? request.details : null,
                branch: request.branch,
                isFulfilled: false
            });
            setInfoModal({
                show: true,
                title: 'Solicitud Enviada',
                message: 'La solicitud de insumos ha sido enviada correctamente.',
                isError: false
            });
            setRequest({ item: '', details: '', branch: 'Sucursal Principal' });
        } catch (err) {
            setInfoModal({
                show: true,
                title: 'Error',
                message: 'Hubo un error al enviar la solicitud. Intente nuevamente.',
                isError: true
            });
        }
    };

    if (loading) return <div className="loading-container">Cargando tareas...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1>Mantenimiento</h1>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Section 1: Tasks List */}
                <div>
                    <h2>Tareas Asignadas</h2>
                    <div className="grid-container" style={{ gridTemplateColumns: '1fr' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                borderLeft: '4px solid #3b82f6',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{task.description}</h3>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        Frecuencia: {task.frequency === 'Daily' ? 'Diaria' : task.frequency === 'Weekly' ? 'Semanal' : 'Mensual'}
                                    </span>
                                </div>
                                <CheckSquare size={24} color="#94a3b8" />
                            </div>
                        ))}
                        {tasks.length === 0 && <p>No hay tareas asignadas.</p>}
                    </div>
                </div>

                {/* Section 2: Supply Request Form */}
                <div>
                    <h2>Solicitar Insumos Faltantes</h2>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <form onSubmit={handleRequest}>
                            <div className="form-group">
                                <label className="input-label">Insumo Faltante</label>
                                <select
                                    className="input-field"
                                    value={request.item}
                                    onChange={(e) => setRequest({ ...request, item: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un insumo...</option>
                                    {suppliesList.map(item => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>

                            {request.item === 'Otro' && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label className="input-label">Detalle del Insumo</label>
                                    <textarea
                                        className="input-field"
                                        value={request.details}
                                        onChange={(e) => setRequest({ ...request, details: e.target.value })}
                                        required
                                        placeholder="Especifique qué insumo necesita..."
                                    />
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="input-label">Sucursal</label>
                                <select
                                    className="input-field"
                                    value={request.branch}
                                    onChange={(e) => setRequest({ ...request, branch: e.target.value })}
                                >
                                    <option value="Sucursal Principal">Sucursal Principal</option>
                                    <option value="Independencia">Independencia</option>
                                    <option value="Tucuman">Tucumán</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                                Enviar Solicitud
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
