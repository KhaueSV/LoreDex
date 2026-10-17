import { useEffect, useRef, useState } from 'react';
import '../../css/usermenu.css';

const ShieldIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const HomeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
    </svg>
);

export default function UserMenu({ user, isAdmin, view, onToggleAdmin, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Fecha o menu ao clicar fora
    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    if (!user) return null;

    return (
        <div className="um-bar">
            {isAdmin && (
                <button className={`um-admin ${view === 'admin' ? 'is-active' : ''}`} onClick={onToggleAdmin}>
                    {view === 'admin' ? <HomeIcon /> : <ShieldIcon />}
                    <span>{view === 'admin' ? 'Voltar ao site' : 'Painel admin'}</span>
                </button>
            )}

            <div className="um-user" ref={ref}>
                <button className="um-avatar" onClick={() => setOpen(!open)} aria-label="Menu do usuário">
                    {user.name?.charAt(0).toUpperCase()}
                </button>

                {open && (
                    <div className="um-dropdown">
                        <div className="um-info">
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                            <span className={`um-badge ${isAdmin ? 'admin' : ''}`}>
                                {isAdmin ? 'Administrador' : 'Cliente'}
                            </span>
                        </div>
                        <button className="um-logout" onClick={onLogout}>
                            <LogoutIcon /> Sair
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}