import React, { useEffect, useState } from 'react';
// Importando o serviço que criamos
import { getWorks, createWork } from '../services/api';

export default function App() {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para o Formulário de Cadastro
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState('');

    // Requisito: Listar recursos da API (usando o Serviço)
    const fetchMyNovels = () => {
        setLoading(true);
        getWorks()
            .then(data => {
                setWorks(data); // Salva os dados vindos do Laravel
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao buscar obras:", err);
                setLoading(false);
            });
    };

    useEffect(() => { 
        fetchMyNovels(); 
    }, []);

    // Requisito: POST para a API e atualizar a lista
    const handleCadastro = async (e) => {
        e.preventDefault();
        
        const novaNovel = {
            title: title,
            description: description,
            cover_image: coverImage
        };

        try {
            await createWork(novaNovel); // Faz o POST
            setShowForm(false); // Fecha o modal
            setTitle(''); setDescription(''); setCoverImage(''); // Limpa o formulário
            
            // Requisito: Atualiza a lista após o cadastro
            fetchMyNovels();
            alert("Obra cadastrada com sucesso no seu banco de dados!");
        } catch (error) {
            alert("Erro ao cadastrar. Verifique se o backend do Laravel está pronto.");
        }
    };

    return (
        <>
            <style>{`
                .loredex-card { transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.05); }
                .loredex-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5); border-color: #6366f1; }
                .btn-primary { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
                .btn-primary:hover { background: #4f46e5; }
                .form-input { width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; }
            `}</style>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                
                {/* CABEÇALHO */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(30, 41, 59, 0.7)', padding: '30px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '50%', padding: '10px' }}>
                            <img src="/logo.png" alt="LoreDex" style={{ width: '60px', height: '60px' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '36px', color: '#f8fafc' }}>Lore<span style={{ color: '#6366f1' }}>Dex</span></h1>
                            <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Meu Compêndio Pessoal (Laravel API)</p>
                        </div>
                    </div>
                    
                    {/* Botão para abrir o formulário */}
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        + Cadastrar Nova Novel
                    </button>
                </header>

                {/* LISTAGEM DOS RECURSOS (Requisito) */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6366f1' }}>Carregando dados da API Laravel...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '28px' }}>
                        {works.length === 0 ? (
                            <p style={{ color: 'white' }}>Nenhuma novel cadastrada ainda. Adicione a primeira!</p>
                        ) : (
                            works.map((work) => (
                                <div key={work.id} className="loredex-card" style={{ background: '#1e293b', borderRadius: '16px', overflow: 'hidden' }}>
                                    <div style={{ height: '320px', width: '100%' }}>
                                        {/* Fallback de imagem caso a pessoa não coloque URL */}
                                        <img src={work.cover_image || 'https://via.placeholder.com/220x320/0f172a/6366f1?text=Sem+Capa'} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{ margin: '0 0 10px 0', color: '#f1f5f9' }}>{work.title}</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{work.description?.substring(0, 50)}...</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* FORMULÁRIO DE CADASTRO (Requisito) */}
                {showForm && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative' }}>
                            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                            
                            <h2 style={{ color: 'white', marginTop: 0 }}>Cadastrar Recurso</h2>
                            
                            <form onSubmit={handleCadastro}>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>Título da Novel</label>
                                    <input type="text" required className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Solo Leveling" />
                                </div>
                                
                                <div>
                                    <label style={{ color: '#94a3b8' }}>URL da Capa (Imagem)</label>
                                    <input type="text" className="form-input" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://link-da-imagem.com/foto.jpg" />
                                </div>

                                <div>
                                    <label style={{ color: '#94a3b8' }}>Descrição</label>
                                    <textarea required className="form-input" rows="4" value={description} onChange={e => setDescription(e.target.value)} placeholder="Sinopse da história..."></textarea>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                    Salvar na API
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}