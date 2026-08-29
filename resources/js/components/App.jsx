import React, { useEffect, useState } from 'react';

export default function App() {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedWork, setSelectedWork] = useState(null);

    const fetchNovels = (searchTerm = '') => {
        setLoading(true);
        const query = `
        query ($search: String) {
          Page(page: 1, perPage: 12) {
            media(type: MANGA, format: NOVEL, search: $search, sort: POPULARITY_DESC) {
              id
              title { english romaji }
              coverImage { extraLarge }
              description
              status
              genres
              averageScore
            }
          }
        }
        `;
        const variables = searchTerm ? { search: searchTerm } : {};

        fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        })
            .then(res => res.json())
            .then(data => {
                if (data.data?.Page?.media) setWorks(data.data.Page.media);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    };

    useEffect(() => { fetchNovels(); }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchNovels(search);
    };

    return (
        <>
            {/* ESTILOS CSS PARA ANIMAÇÕES E HOVER */}
            <style>{`
                .loredex-card {
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .loredex-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
                    border-color: #6366f1;
                }
                .search-btn {
                    transition: background 0.2s ease;
                }
                .search-btn:hover {
                    background: #4f46e5 !important;
                }
                .modal-content {
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                
                {/* CABEÇALHO LOREDEX */}
                <header style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '25px', 
                    marginBottom: '40px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    padding: '30px',
                    borderRadius: '24px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* SUA LOGO AQUI */}
                        <div style={{ 
                            background: '#f8fafc', /* Fundo claro para a logo escura destacar */
                            borderRadius: '50%', 
                            padding: '10px',
                            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                        }}>
                            <img src="/logo.png" alt="LoreDex Logo" style={{ width: '60px', height: '60px', display: 'block' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '36px', color: '#f8fafc', fontWeight: '800', letterSpacing: '1px' }}>
                                Lore<span style={{ color: '#6366f1' }}>Dex</span>
                            </h1>
                            <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '16px' }}>O seu compêndio definitivo de histórias.</p>
                        </div>
                    </div>

                    {/* BARRA DE PESQUISA */}
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Busque por um título no LoreDex..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                flexGrow: 1, padding: '16px 20px', borderRadius: '12px',
                                border: '1px solid #475569', background: 'rgba(15, 23, 42, 0.6)',
                                color: 'white', fontSize: '16px', outline: 'none'
                            }}
                        />
                        <button type="submit" className="search-btn" style={{
                            padding: '0 32px', borderRadius: '12px', border: 'none',
                            background: '#6366f1', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
                        }}>
                            Pesquisar
                        </button>
                    </form>
                </header>

                {/* GRID DE CARDS */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6366f1', fontSize: '20px' }}>Consultando o LoreDex...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '28px' }}>
                        {works.map((work) => (
                            <div key={work.id} className="loredex-card" onClick={() => setSelectedWork(work)}
                                style={{
                                    background: '#1e293b', borderRadius: '16px', overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column', cursor: 'pointer'
                                }}>
                                <div style={{ height: '320px', width: '100%', position: 'relative' }}>
                                    <img src={work.coverImage.extraLarge} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {work.averageScore && (
                                        <span style={{
                                            position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.9)',
                                            color: '#fbbf24', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900'
                                        }}>⭐ {(work.averageScore / 10).toFixed(1)}</span>
                                    )}
                                </div>
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#f1f5f9', lineHeight: '1.4' }}>
                                        {work.title.english || work.title.romaji}
                                    </h3>
                                    <div style={{ marginTop: 'auto' }}>
                                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Ver detalhes ➔</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL (JANELA DE DETALHES) */}
                {selectedWork && (
                    <div onClick={() => setSelectedWork(null)} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(5px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: '24px', maxWidth: '800px', width: '100%', maxHeight: '85vh',
                            overflowY: 'auto', border: '1px solid #334155', position: 'relative', color: 'white', padding: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                        }}>
                            <button onClick={() => setSelectedWork(null)} style={{
                                position: 'absolute', top: '20px', right: '20px', background: '#334155', border: 'none',
                                color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px'
                            }}>✕</button>

                            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                                <img src={selectedWork.coverImage.extraLarge} alt="Capa"
                                    style={{ width: '220px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} />
                                
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <h2 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '28px' }}>
                                        {selectedWork.title.english || selectedWork.title.romaji}
                                    </h2>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                        {selectedWork.genres?.map((g) => (
                                            <span key={g} style={{
                                                background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8',
                                                padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600'
                                            }}>{g}</span>
                                        ))}
                                    </div>

                                    <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.7' }}
                                        dangerouslySetInnerHTML={{ __html: selectedWork.description || 'Nenhum registro encontrado no compêndio.' }}
                                    />

                                    <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                                        <button style={{
                                            background: '#6366f1', color: 'white', border: 'none',
                                            padding: '14px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px',
                                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                                        }}>
                                            + Salvar no meu LoreDex
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}