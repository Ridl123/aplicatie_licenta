import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        try {
            const response = await api.post('/Auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            navigate('/'); 
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                setError('Email sau parolă incorectă.');
            } else {
                setError('A apărut o eroare la conectare.');
            }
        }
    };

    // --- NOU: FUNCȚIE DE LOGIN CA VIZITATOR ---
    const handleGuestLogin = async () => {
        setError('');
        try {
            const response = await api.post('/Auth/login-guest');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            navigate('/'); 
        } catch (err) {
            setError('Eroare la autentificarea vizitatorului.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
            <div style={{ padding: '2rem', backgroundColor: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '320px', border: '1px solid #334155' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>112 DISPECERAT</h2>
                
                {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
                
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '13px' }}>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '13px' }}>Parolă</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }}
                        />
                    </div>
                    
                    <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
                        CONECTARE
                    </button>
                </form>

                <div style={{ textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                    <button onClick={handleGuestLogin} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        INTRA CA VIZITATOR (GUEST)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;