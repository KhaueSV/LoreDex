import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, setUserRole } from '../services/api';
import '../../css/admin.css';

export default function AdminPanel({ currentUserId }) {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [changingId, setChangingId] = useState(null);

    const load = async () => {
        try {
            setError('');
            setLoading(true);
            const [adminStats, adminUsers] = await Promise.all([
                getAdminStats(),
                getAdminUsers(),
            ]);
            setStats(adminStats);
            setUsers(adminUsers);
        } catch (e) {
            setError(e.message || 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const changeRole = async (user) => {
        setError('');
        setChangingId(user.id);
        try {
            await setUserRole(user.id, user.role === 'admin' ? 'cliente' : 'admin');
            await load();
        } catch (e) {
            setError(e.message || 'Não foi possível alterar o papel do usuário.');
        } finally {
            setChangingId(null);
        }
    };

    const statCards = [
        { label: 'Total de usuários', value: stats?.users, desc: 'Contas cadastradas' },
        { label: 'Administradores', value: stats?.admins, desc: 'Contas com acesso administrativo' },
        { label: 'Obras cadastradas', value: stats?.works, desc: 'Obras na plataforma' },
    ];

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div>
                    <span className="admin-eyebrow">LOREDEX / ADMINISTRAÇÃO</span>
                    <h1>Painel administrativo</h1>
               </div>
                <button type="button" className="admin-btn" onClick={load} disabled={loading}>
                    Atualizar dados
                </button>
            </header>

            {error && (
                <div className="admin-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError('')} aria-label="Fechar">×</button>
                </div>
            )}

            <section className="admin-stats" aria-label="Estatísticas">
                {statCards.map((item) => (
                    <article key={item.label} className="admin-stat-card">
                        <span>{item.label}</span>
                        <strong>{item.value ?? '—'}</strong>
                        <small>{item.desc}</small>
                    </article>
                ))}
            </section>

            <section className="admin-users">
                <div className="admin-section-header">
                    <div>
                        <h2>Usuários</h2>
                        <p>Consulte as contas e gerencie seus níveis de acesso.</p>
                    </div>
                    <span className="admin-badge">
                        {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
                    </span>
                </div>

                {loading ? (
                    <div className="admin-state">Carregando dados...</div>
                ) : users.length === 0 ? (
                    <div className="admin-state">Nenhum usuário encontrado.</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Papel</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const isAdmin = u.role === 'admin';
                                    const isSelf = u.id === currentUserId;

                                    return (
                                        <tr key={u.id}>
                                            <td className="admin-name">
                                                {u.name}
                                                {isSelf && <span className="admin-you">Você</span>}
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-tag ${isAdmin ? 'is-admin' : ''}`}>
                                                    {isAdmin ? 'Administrador' : 'Cliente'}
                                                </span>
                                            </td>
                                            <td>
                                                {!isSelf ? (
                                                    <button
                                                        type="button"
                                                        className={`role-btn ${isAdmin ? 'is-demote' : 'is-promote'}`}
                                                        onClick={() => changeRole(u)}
                                                        disabled={changingId !== null}
                                                    >
                                                        {changingId === u.id
                                                            ? 'Salvando...'
                                                            : isAdmin ? 'Tornar cliente' : 'Tornar admin'}
                                                    </button>
                                                ) : (
                                                    <span className="admin-muted">Conta atual</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}