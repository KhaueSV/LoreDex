import { useEffect, useState } from 'react';
import { getProfile, updateProfile, updateWorkActivity } from '../services/api';

export default function Profile({ user, onUpdate, onOpenWork }) {
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getProfile().then(setProfile).catch(error => setMessage(error.message));
    }, []);

    async function save(event) {
        event.preventDefault();
        const form = event.currentTarget;
        setBusy(true);
        setMessage('');
        try {
            const updated = await updateProfile(Object.fromEntries(new FormData(form)));
            form.reset();
            onUpdate(updated);
            setMessage('Perfil atualizado.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function removeFavorite(work) {
        try {
            await updateWorkActivity(work.id, { is_favorite: false });
            setProfile(current => ({ ...current, favorites: current.favorites.filter(item => item.id !== work.id) }));
        } catch (error) {
            setMessage(error.message);
        }
    }

    return (
        <main className="account-page">
            <h1>Perfil</h1>
            <form className="account-panel" key={user.updated_at} onSubmit={save}>
                <label>Nome<input name="name" defaultValue={user.name} autoComplete="name" maxLength={255} required /></label>
                <label>E-mail<input name="email" defaultValue={user.email} type="email" autoComplete="email" maxLength={255} required /></label>
                <label>Senha atual<input name="current_password" type="password" autoComplete="current-password" /></label>
                <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} /></label>
                <label>Confirme a nova senha<input name="password_confirmation" type="password" autoComplete="new-password" /></label>
                <button className="btn-primary" disabled={busy}>Salvar perfil</button>
            </form>
            <p role="status">{message}</p>
            {profile && [
                ['Favoritas', profile.favorites],
                ['Adicionadas recentemente', profile.recently_added],
                ['Vistas recentemente', profile.recently_viewed],
            ].map(([title, works]) => (
                <section className="account-panel" key={title}>
                    <h2>{title}</h2>
                    {works.length ? <ul>{works.map(work => (
                        <li key={work.id}>
                            <button type="button" onClick={() => onOpenWork(work)}>{work.title}</button>
                            {title === 'Favoritas' && <button type="button" onClick={() => removeFavorite(work)}>Remover dos favoritos</button>}
                        </li>
                    ))}</ul> : <p>Nenhuma obra.</p>}
                </section>
            ))}
        </main>
    );
}
