import { useEffect, useState } from 'react';
import { collectionRequest, getWorks } from '../services/api';

export default function Collections({ onOpenWork }) {
    const [collections, setCollections] = useState([]);
    const [library, setLibrary] = useState([]);
    const [filter, setFilter] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        collectionRequest().then(setCollections).catch(error => setMessage(error.message));
        getWorks().then(setLibrary).catch(error => setMessage(error.message));
    }, []);

    async function change(path, method, data) {
        setMessage('');
        setBusy(true);
        try {
            const collection = await collectionRequest(path, method, data);
            setCollections(current => {
                if (!collection) return current.filter(item => '/' + item.id !== path);
                return current.some(item => item.id === collection.id)
                    ? current.map(item => item.id === collection.id ? collection : item)
                    : [collection, ...current];
            });
            return true;
        } catch (error) {
            setMessage(error.message);
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function create(event) {
        event.preventDefault();
        const form = event.currentTarget;
        if (await change('', 'POST', Object.fromEntries(new FormData(form)))) form.reset();
    }

    return (
        <main className="account-page">
            <h1>Coleções</h1>
            <form className="account-panel" onSubmit={create}>
                <label>Nome da coleção<input name="name" required maxLength={100} /></label>
                <label>Descrição<textarea name="description" maxLength={1000} /></label>
                <button className="btn-primary" disabled={busy}>Criar coleção</button>
            </form>
            <label>Filtrar obras nas coleções<input type="search" value={filter} onChange={event => setFilter(event.target.value)} /></label>
            <p role="status">{message}</p>
            {collections.slice().sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)).map(collection => {
                const path = '/' + collection.id;
                const available = library.filter(work => !collection.works.some(item => item.id === work.id));
                const visible = collection.works.filter(work => work.title.toLowerCase().includes(filter.trim().toLowerCase()));
                return (
                    <section className="account-panel" key={collection.id}>
                        <h2>{collection.name}</h2>
                        {collection.description && <p>{collection.description}</p>}
                        {collection.tags?.length > 0 && <p>{collection.tags.join(' · ')}</p>}
                        <details>
                            <summary>Editar coleção</summary>
                            <form key={JSON.stringify([collection.name, collection.description, collection.tags])} onSubmit={event => {
                                event.preventDefault();
                                const fields = Object.fromEntries(new FormData(event.currentTarget));
                                const tags = fields.tags.split(',').map(tag => tag.trim()).filter(Boolean);
                                change(path, 'PATCH', { name: fields.name, description: fields.description, tags });
                            }}>
                                <label>Nome<input name="name" defaultValue={collection.name} maxLength={100} required /></label>
                                <label>Descrição<textarea name="description" defaultValue={collection.description || ''} maxLength={1000} /></label>
                                <label>Etiquetas separadas por vírgula<input name="tags" defaultValue={collection.tags?.join(', ') || ''} /></label>
                                <button disabled={busy}>Salvar coleção</button>
                            </form>
                        </details>
                        <div className="account-actions">
                            <button type="button" disabled={busy} onClick={() => change(path, 'PATCH', { is_pinned: !collection.is_pinned })}>
                                {collection.is_pinned ? 'Desafixar' : 'Fixar'}
                            </button>
                            <button type="button" disabled={busy} onClick={() => {
                                if (window.confirm('Excluir esta coleção?')) change(path, 'DELETE');
                            }}>Excluir coleção</button>
                        </div>
                        <form onSubmit={event => {
                            event.preventDefault();
                            const workId = new FormData(event.currentTarget).get('work_id');
                            if (workId) change(path + '/works', 'POST', { work_id: Number(workId) });
                        }}>
                            <label>Adicionar da biblioteca
                                <select name="work_id" required>
                                    <option value="">Selecione uma obra</option>
                                    {available.map(work => <option key={work.id} value={work.id}>{work.title}</option>)}
                                </select>
                            </label>
                            <button disabled={busy || !available.length}>Adicionar</button>
                        </form>
                        {visible.length ? <ul>{visible.map(work => (
                            <li key={work.id}>
                                <button type="button" onClick={() => onOpenWork(work)}>{work.title}</button>
                                <button type="button" disabled={busy} onClick={() => change(path + '/works/' + work.id, 'DELETE')}>Remover</button>
                            </li>
                        ))}</ul> : <p>Nenhuma obra encontrada.</p>}
                    </section>
                );
            })}
        </main>
    );
}
