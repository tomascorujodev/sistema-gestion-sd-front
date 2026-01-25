import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function ShiftAutoCloseNotification() {
    const { shiftAutoClosed, setShiftAutoClosed, employee } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (shiftAutoClosed) {
            // Show notification for 5 seconds then redirect
            const timer = setTimeout(() => {
                setShiftAutoClosed(false);
                // Optionally navigate to home or show report
                navigate('/');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [shiftAutoClosed, setShiftAutoClosed, navigate]);

    if (!shiftAutoClosed) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#f59e0b',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 9999,
            maxWidth: '400px',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <AlertCircle size={24} />
            <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Turno Cerrado Automáticamente
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    Tu turno ha alcanzado el límite de 11 horas diarias y se ha cerrado automáticamente.
                    {employee && ` Empleado: ${employee.name}`}
                </p>
            </div>
        </div>
    );
}
