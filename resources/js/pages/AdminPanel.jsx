import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, setUserRole } from '../services/api';

export default function AdminPanel({ currentUserId }) {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            setStats(await getAdminStats());
            setUsers(await getAdminUsers());
        } catch (e) {
            setError(e.message);
        }
    };

    useEffect(() => { load(); }, []);

    const changeRole = async (u) => {
        setError('');
        try {
            await setUserRole(u.id, u.role === 'admin' ? 'cliente' : 'admin');
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const card = { background: '#161a26', padding: 20, borderRadius: 12, minWidth: 140 };

    return (
        <div style={{ maxWidth: 900, margin: '24px auto', padding: 16, color: '#e8ecf5' }}>
            <h2>Painel do Administrador</h2>
            {error && <p style={{ color: '#ff9d9d' }}>{error}</p>}

            {stats && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
                    <div style={card}><h3>{stats.users}</h3>usuários</div>
                    <div style={card}><h3>{stats.admins}</h3>admins</div>
                    <div style={card}><h3>{stats.works}</h3>obras</div>
                </div>
            )}

            <h3>Usuários</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left' }}>
                        <th>Nome</th><th>E-mail</th><th>Papel</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id} style={{ borderTop: '1px solid #2a3042' }}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>
                                {u.id !== currentUserId && (
                                    <button onClick={() => changeRole(u)}>
                                        {u.role === 'admin' ? 'Tornar cliente' : 'Tornar admin'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}