import React, { useEffect, useState } from 'react';
import Login from '../pages/Login';
import { getWorks, createWork, getToken, logout } from '../services/api';


function Home() {
        // ---------------- ESTADOS ----------------
        // 1. Banco de Dados Local (Laravel)
        const [myWorks, setMyWorks] = useState([]);
        const [loadingMyWorks, setLoadingMyWorks] = useState(true);
        
        // 2. Busca na Internet (AniList)
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState([]);
        const [isSearching, setIsSearching] = useState(false);
       
        // 3. Formulário Manual
        const [showForm, setShowForm] = useState(false);
        const [manualTitle, setManualTitle] = useState('');
        const [manualCover, setManualCover] = useState('');
        const [manualDesc, setManualDesc] = useState('');

        // ---------------- FUNÇÕES ----------------

        // Puxar do seu banco (GET)
        const fetchMyNovels = () => {
            setLoadingMyWorks(true);
            getWorks()
                .then(data => {
                    setMyWorks(data);
                    setLoadingMyWorks(false);
                })
                .catch(err => {
                    console.error("Erro ao buscar obras:", err);
                    setLoadingMyWorks(false);
                });
        };

        useEffect(() => { fetchMyNovels(); }, []);

    // Buscar na API da Internet
    const handleSearchAniList = async (valor) => {
    const busca = valor.trim();

    if (!busca) {
        setSearchResults([]);
        return;
    }

    setIsSearching(true);

    const query = `
        query ($search: String) {
            Page(page: 1, perPage: 4) {
                media(search: $search, type: MANGA) {
                    id
                    title { romaji }
                    coverImage { extraLarge }
                    description(asHtml: false)
                }
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                variables: {
                    search: busca
                }
            })
        });

        const result = await response.json();

        setSearchResults(result.data.Page.media);

    } catch (error) {
        console.error("Erro na API externa", error);

    } finally {
        setIsSearching(false);
    }
};

   const handleSearchChange = (e) => {
    const valor = e.target.value;

    setSearchQuery(valor);

    if (!valor.trim()) {
        setSearchResults([]);
        return;
    }

    // Faz a busca imediatamente enquanto digita
    handleSearchAniList(valor);
};

        // Salvar no Laravel vindo da Internet
        const handleSaveFromApi = async (novel) => {
            const novaNovel = {
                title: novel.title.romaji,
                cover_image: novel.coverImage.extraLarge,
                description: novel.description ? novel.description.replace(/<[^>]+>/g, '') : 'Sem sinopse disponível.'
            };
            enviarParaLaravel(novaNovel);
        };

        // Salvar no Laravel vindo do Formulário Manual
        const handleManualCadastro = async (e) => {
            e.preventDefault();
            const novaNovel = {
                title: manualTitle,
                cover_image: manualCover,
                description: manualDesc
            };
            enviarParaLaravel(novaNovel);
            
            // Limpa e fecha o form
            setShowForm(false);
            setManualTitle(''); setManualCover(''); setManualDesc('');
        };

        // Função central para fazer o POST e atualizar a tela
        const enviarParaLaravel = async (dados) => {
            try {
                await createWork(dados);
                fetchMyNovels();
                alert(`"${dados.title}" salvo com sucesso no seu banco de dados!`);
                setSearchResults([]); // Limpa a busca
                setSearchQuery('');
            } catch (error) {
                alert("Erro ao salvar no banco de dados.");
            }
        };

        // ---------------- INTERFACE ----------------
        return (
            <>
                <style>{`
                    body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; font-family: sans-serif; margin: 0; min-height: 100vh; }
                    .loredex-card { transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.05); background: #1e293b; border-radius: 16px; overflow: hidden; }
                    .loredex-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5); border-color: #6366f1; }
                    .btn-primary { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                    .btn-primary:hover { background: #4f46e5; }
                    .btn-secondary { background: transparent; color: #818cf8; padding: 12px 24px; border: 1px solid #818cf8; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                    .btn-secondary:hover { background: rgba(129, 140, 248, 0.1); }
                    .btn-save { background: #10b981; color: white; padding: 10px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 10px; }
                    .btn-save:hover { background: #059669; }
                    .search-input { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 16px; margin-right: 10px; }
                    .form-input { width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; }
                `}</style>

                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                    
                    {/* CABEÇALHO */}
                    <header style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '30px', borderRadius: '24px', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <img src="/logo.png" alt="LoreDex" style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '50%', padding: '5px' }} />
                            <div>
                                <h1 style={{ margin: 0, fontSize: '36px' }}>Lore<span style={{ color: '#6366f1' }}>Dex</span></h1>
                                <p style={{ margin: 0, color: '#94a3b8' }}>Busque na API mundial ou insira manualmente.</p>
                            </div>
                        </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>

        <div style={{ display: 'flex', flex: 1, minWidth: '250px' }}>
    <input
    type="text"
    className="search-input"
    placeholder="Buscar obras na internet..."
    value={searchQuery}
    onChange={handleSearchChange}
    />
    </div>

        <span style={{ color: '#64748b' }}>ou</span>

        <button
            className="btn-secondary"
            onClick={() => setShowForm(true)}
        >
            + Cadastrar Manualmente
        </button>

    </div>
                    </header>

                    {/* RESULTADOS DA API */}
                    {searchResults.length > 0 && (
                        <div style={{ marginBottom: '50px', padding: '20px', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed #6366f1', borderRadius: '16px' }}>
                            <h2 style={{ color: '#818cf8', marginTop: 0 }}>Resultados da Internet (Clique para Salvar)</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                {searchResults.map((novel) => (
                                    <div key={novel.id} className="loredex-card">
                                        <img src={novel.coverImage.extraLarge} alt="Capa" style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
                                        <div style={{ padding: '15px' }}>
                                            <h4 style={{ margin: '0 0 10px 0' }}>{novel.title.romaji}</h4>
                                            <button className="btn-save" onClick={() => handleSaveFromApi(novel)}>
                                                + Salvar no Banco
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BANCO DE DADOS LOCAL */}
                    <div>
                        <h2>Meu Banco de Dados</h2>
                        {loadingMyWorks ? (
                            <p style={{ color: '#6366f1' }}>Carregando dados da sua API Laravel...</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '28px' }}>
                                {myWorks.length === 0 ? (
                                    <p style={{ color: '#94a3b8' }}>Seu banco de dados está vazio. Busque acima ou cadastre manualmente!</p>
                                ) : (
                                    myWorks.map((work) => (
                                        <div key={work.id} className="loredex-card">
                                            <img src={work.cover_url || 'https://via.placeholder.com/220x320/0f172a/6366f1?text=Sem+Capa'} alt="Capa" style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
                                            <div style={{ padding: '20px' }}>
                                                <h3 style={{ margin: '0 0 10px 0' }}>{work.title}</h3>
                                                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                                                    {work.synopsis ? work.synopsis.substring(0, 80) + '...' : 'Sem sinopse.'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* MODAL DE CADASTRO MANUAL */}
                    {showForm && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                            <div style={{ background: '#1e293b', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative', border: '1px solid #475569' }}>
                                <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                                <h2 style={{ color: 'white', marginTop: 0 }}>Cadastro Manual</h2>
                                <form onSubmit={handleManualCadastro}>
                                    <div>
                                        <label style={{ color: '#94a3b8' }}>Título da Novel</label>
                                        <input type="text" required className="form-input" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ color: '#94a3b8' }}>URL da Capa (Opcional)</label>
                                        <input type="text" className="form-input" value={manualCover} onChange={e => setManualCover(e.target.value)} placeholder="https://link-da-imagem.com/foto.jpg" />
                                    </div>
                                    <div>
                                        <label style={{ color: '#94a3b8' }}>Descrição / Sinopse</label>
                                        <textarea required className="form-input" rows="4" value={manualDesc} onChange={e => setManualDesc(e.target.value)}></textarea>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                        Salvar no Banco
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
}
   export default function App() {
       const [logged, setLogged] = useState(!!getToken());

       if (!logged) {
           return <Login onSuccess={() => setLogged(true)} />;
       }

       return (
           <>
               <button onClick={async () => { await logout(); setLogged(false); }}>
                   Sair
               </button>
               <Home />
           </>
       );
   }