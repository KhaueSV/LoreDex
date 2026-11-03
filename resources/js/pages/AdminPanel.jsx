import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, setUserRole, getAdminWorks, toggleBlockWorkAdmin, deleteWorkAdmin } from '../services/api';
import '../../css/admin.css';

export default function AdminPanel({ currentUserId }) {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [works, setWorks] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [changingId, setChangingId] = useState(null);
    const [changingWorkId, setChangingWorkId] = useState(null);

    const load = async () => {
        try {
            setError('');
            setLoading(true);
            const [adminStats, adminUsers, adminWorks] = await Promise.all([
                getAdminStats(),
                getAdminUsers(),
                getAdminWorks(),
            ]);
            setStats(adminStats);
            setUsers(adminUsers);
            setWorks(adminWorks);
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

    const handleToggleBlock = async (work) => {
        setError('');
        setChangingWorkId(work.id);
        try {
            const res = await toggleBlockWorkAdmin(work.id);
            setWorks((prev) => prev.map((w) => (w.id === work.id ? { ...w, is_blocked: res.work.is_blocked } : w)));
        } catch (e) {
            setError(e.message || 'Não foi possível alterar o status da obra.');
        } finally {
            setChangingWorkId(null);
        }
    };

    const handleDeleteWork = async (work) => {
        const confirmMsg = `Tem certeza que deseja EXCLUIR "${work.title}" permanentemente de todo o catálogo do sistema? Ela será apagada de todos os usuários.`;
        if (!window.confirm(confirmMsg)) return;

        setError('');
        setChangingWorkId(work.id);
        try {
            await deleteWorkAdmin(work.id);
            setWorks((prev) => prev.filter((w) => w.id !== work.id));
        } catch (e) {
            setError(e.message || 'Não foi possível excluir a obra.');
        } finally {
            setChangingWorkId(null);
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

            {/* SEÇÃO: CATÁLOGO GERAL DE OBRAS (CONTROLE DO ADMIN) */}
            <section className="admin-users" style={{ marginBottom: '32px' }}>
                <div className="admin-section-header">
                    <div>
                        <h2>Catálogo Geral de Obras</h2>
                        <p>Bloqueie obras temporariamente com problemas ou remova-as permanentemente da plataforma.</p>
                    </div>
                    <span className="admin-badge">
                        {works.length} {works.length === 1 ? 'obra' : 'obras'}
                    </span>
                </div>

                {loading ? (
                    <div className="admin-state">Carregando catálogo...</div>
                ) : works.length === 0 ? (
                    <div className="admin-state">Nenhuma obra cadastrada no catálogo.</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Capa</th>
                                    <th>Título</th>
                                    <th>Formato</th>
                                    <th>Leitores</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {works.map((w) => {
                                    const isBusy = changingWorkId === w.id;
                                    return (
                                        <tr key={w.id} style={{ opacity: w.is_blocked ? 0.65 : 1 }}>
                                            <td style={{ width: '60px' }}>
                                                <img
                                                    src={w.cover_url || 'https://via.placeholder.com/40x55'}
                                                    alt={w.title}
                                                    style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '6px' }}
                                                />
                                            </td>
                                            <td className="admin-name">
                                                {w.title}
                                                {w.is_blocked && (
                                                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Bloqueada
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{w.type || 'Manga'}</td>
                                            <td>{w.users_count ?? 0} {w.users_count === 1 ? 'leitor' : 'leitores'}</td>
                                            <td>
                                                <span className={`role-tag ${w.is_blocked ? 'is-demote' : 'is-admin'}`}>
                                                    {w.is_blocked ? 'Indisponível' : 'Ativa'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        className={`role-btn ${w.is_blocked ? 'is-promote' : 'is-demote'}`}
                                                        onClick={() => handleToggleBlock(w)}
                                                        disabled={isBusy}
                                                        title={w.is_blocked ? 'Liberar obra de volta para as bibliotecas' : 'Tirar obra do ar temporariamente'}
                                                    >
                                                        {isBusy ? 'Salvando...' : w.is_blocked ? 'Desbloquear' : 'Bloquear (Ocultar)'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="role-btn is-demote"
                                                        style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.2)' }}
                                                        onClick={() => handleDeleteWork(w)}
                                                        disabled={isBusy}
                                                        title="Apagar permanentemente do banco"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* SEÇÃO: USUÁRIOS */}
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
