import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import '../Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Credenciales inválidas');
        }
    };



    return (
        <>
            <div className="login-container">
                <div className="login-card">
                    <h1 className="login-title">Iniciar Sesión</h1>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Usuario</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-field input-with-icon"
                                    placeholder="Ingresar usuario"
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Contraseña</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field input-with-icon"
                                    placeholder="Ingresar contraseña"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary submit-btn"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>

        </>
    );
}
