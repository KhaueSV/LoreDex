import React, { useEffect, useMemo, useState, useRef } from 'react';
import Login from '../pages/Login';
import AdminPanel from '../pages/AdminPanel';
import '../../css/home.css';
import { getWorks, createWork, updateWork, deleteWork, getToken, logout, getMe } from '../services/api';
import TelaCapitulos from '../pages/TelaCapitulos';
import UserMenu from './UserMenu';

const PLACEHOLDER = 'https://via.placeholder.com/220x320/0f172a/6366f1?text=Sem+Capa';

// ---------------- ÍCONES ----------------
const Icons = {
    Recent: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    Library: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
    Search: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
};

// ---------------- SUBCOMPONENTE: CARROSSEL ----------------
const CarouselSection = ({ title, icon, works, loading, onEdit, onDelete, onClickWork }) => {
    const carouselRef = useRef(null);

    if (!loading && works.length === 0) return null;

    const scroll = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.75;
            carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="section">
            <div className="section-header">
                <h2 className="section-title">
                    <span className="section-icon">{icon}</span> {title}
                    {!loading && <span className="section-count">{works.length}</span>}
                </h2>
            </div>

            {loading ? (
                <div className="carousel">
                    {[1, 2, 3, 4, 5].map((n) => <div key={n} className="skeleton carousel-item" />)}
                </div>
            ) : (
                <div className="carousel-container">
                    <button className="scroll-btn left" onClick={() => scroll('left')}>‹</button>
                    
                    <div className="carousel" ref={carouselRef}>
                        {works.map((work) => (
                            <article key={work.id} className="loredex-card carousel-item" onClick={() => onClickWork(work)}>
                                <div className="cover">
                                    <img src={work.cover_url || PLACEHOLDER} alt={`Capa de ${work.title}`} />
                                    
                                    <div className="badges">
                                        {work.type && <span className="badge type">{work.type}</span>}
                                        {work.status && <span className="badge status">{work.status}</span>}
                                    </div>

                                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button className="action-btn edit" onClick={() => onEdit(work)}>✎ Editar</button>
                                        <button className="action-btn delete" onClick={() => onDelete(work)}>🗑 Excluir</button>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <h3>{work.title}</h3>
                                    <p>{work.synopsis ? work.synopsis.substring(0, 70) + '...' : 'Sem sinopse.'}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    <button className="scroll-btn right" onClick={() => scroll('right')}>›</button>
                </div>
            )}
        </section>
    );
};

function Home({ isAdmin }) {
    const [allWorks, setAllWorks] = useState([]);
    const [loadingMyWorks, setLoadingMyWorks] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showAdult, setShowAdult] = useState(false);

    // Filtros da biblioteca
    const [filterText, setFilterText] = useState('');
    const [sortBy, setSortBy] = useState('padrao');
    const [libraryShowAdult, setLibraryShowAdult] = useState(false);
    const [filterFormat, setFilterFormat] = useState('todos');
    const [filterStatus, setFilterStatus] = useState('todos');
    
    // NOVO: Filtro múltiplo de Gêneros
    const [selectedGenres, setSelectedGenres] = useState([]);
    const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Mystery'];

    // Modais
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [manualTitle, setManualTitle] = useState('');
    const [manualCover, setManualCover] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualSourceUrl, setManualSourceUrl] = useState('');

    const [workToDelete, setWorkToDelete] = useState(null);
    
    const [workDetails, setWorkDetails] = useState(null);

    const [viewingChaptersWork, setViewingChaptersWork] = useState(null);

    // ---------------- FUNÇÕES BASE ----------------
    const fetchMyNovels = async () => {
        setLoadingMyWorks(true);
        try {
            const data = await getWorks();
            setAllWorks(data);
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoadingMyWorks(false);
        }
    };

    useEffect(() => { fetchMyNovels(); }, []);

    // ---------------- FILTROS ----------------
    // Verifica se algum filtro está ativo
    // ---------------- FILTROS ----------------
    const isFiltering = filterText.trim() !== '' || libraryShowAdult || filterFormat !== 'todos' || filterStatus !== 'todos' || selectedGenres.length > 0 || sortBy !== 'padrao';

    const applyFilter = (list) => {
        const termo = filterText.trim().toLowerCase();
        
        let result = list.filter((w) => {
            // 1. Busca por texto
            const bateTexto = !termo || (w.title || '').toLowerCase().includes(termo) || (w.synopsis || '').toLowerCase().includes(termo);
            
            // 2. Filtro +18 (Garante que entende 1, "1" ou true do Laravel)
            const isAdultWork = w.is_adult === true || w.is_adult === 1 || w.is_adult === '1';
            const bateAdulto = libraryShowAdult ? true : !isAdultWork;
            
            // 3. Filtro de Formato (Ignora diferenças de maiúsculas/minúsculas)
            const safeType = (w.type || '').toUpperCase();
            const bateFormato = filterFormat === 'todos' || safeType === filterFormat.toUpperCase();
            
            // 4. Filtro de Estado (Lida com os diferentes nomes que vêm da API ou do Banco)
            const safeStatus = (w.status || '').toUpperCase();
            let bateStatus = false;
            if (filterStatus === 'todos') {
                bateStatus = true;
            } else if (filterStatus === 'RELEASING') {
                bateStatus = ['RELEASING', 'ONGOING', 'LANCANDO', 'A LANÇAR'].includes(safeStatus);
            } else if (filterStatus === 'FINISHED') {
                bateStatus = ['FINISHED', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO'].includes(safeStatus);
            } else {
                bateStatus = safeStatus === filterStatus.toUpperCase();
            }
            
            // 5. Filtro de Gêneros (Evita que o app quebre se o campo estiver vazio ou errado no banco)
            let obraGeneros = [];
            try {
                if (Array.isArray(w.genres)) {
                    obraGeneros = w.genres;
                } else if (typeof w.genres === 'string') {
                    obraGeneros = JSON.parse(w.genres || '[]');
                }
            } catch (e) {
                obraGeneros = []; // Se não conseguir ler, assume que não tem gênero
            }
            // Põe tudo em maiúsculo para comparar sem erro (Action === ACTION)
            const generosUpper = obraGeneros.map(g => g.toUpperCase());
            const bateGeneros = selectedGenres.length === 0 || selectedGenres.every(g => generosUpper.includes(g.toUpperCase()));

            return bateTexto && bateAdulto && bateFormato && bateStatus && bateGeneros;
        });

        // Ordenação segura (evita erro se o título for null)
        if (sortBy === 'az') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        if (sortBy === 'za') result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        if (sortBy === 'recentes') result.sort((a, b) => b.id - a.id);
        
        return result;
    };

    const sections = useMemo(() => {
        const filteredWorks = applyFilter(allWorks);
        if (isFiltering) return [{ title: 'Resultados da Biblioteca', icon: <Icons.Search />, works: filteredWorks }];
        
        const recentes = [...allWorks].sort((a, b) => b.id - a.id).slice(0, 10);
        return [
            { title: 'Adicionados Recentemente', icon: <Icons.Recent />, works: recentes },
            { title: 'Todas as Obras', icon: <Icons.Library />, works: allWorks }
        ];
    }, [allWorks, filterText, sortBy, libraryShowAdult, filterFormat, filterStatus, selectedGenres, isFiltering]);

    const noResults = !loadingMyWorks && isFiltering && sections.every((s) => s.works.length === 0);

    const clearFilters = () => { 
        setFilterText(''); 
        setSortBy('padrao'); 
        setLibraryShowAdult(false);
        setFilterFormat('todos');
        setFilterStatus('todos');
        setSelectedGenres([]); 
    };

    // ---------------- BUSCA ANILIST E LIMPEZA ----------------
    const handleSearchAniList = async (valor, adult = showAdult) => {
        const busca = valor.trim();
        if (!busca) { setSearchResults([]); return; }

        const query = `
            query ($search: String, $isAdult: Boolean, $genreNotIn: [String]) {
                Page(page: 1, perPage: 4) {
                    media(search: $search, type: MANGA, isAdult: $isAdult, genre_not_in: $genreNotIn) {
                        id title { romaji } coverImage { extraLarge } description(asHtml: false) format status isAdult genres chapters
                    }
                }
            }
        `;
        const variables = { search: busca, isAdult: adult ? undefined : false, genreNotIn: adult ? undefined : ['Hentai', 'Ecchi'] };

        try {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables })
            });
            const result = await response.json();
            setSearchResults(result.data.Page.media);
        } catch (error) {
            console.error('Erro na API:', error);
        }
    };

    const handleSearchChange = (e) => {
        const valor = e.target.value;
        setSearchQuery(valor);
        if (!valor.trim()) { setSearchResults([]); return; }
        handleSearchAniList(valor);
    };

    // Limpar busca
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const toggleAdult = () => {
        const novo = !showAdult;
        setShowAdult(novo);
        if (searchQuery.trim()) handleSearchAniList(searchQuery, novo);
    };

    // ---------------- AÇÕES (SALVAR / EDITAR / EXCLUIR) ----------------
    const enviarParaLaravel = async (dados) => {
        try {
            await createWork(dados);
            await fetchMyNovels();
            clearSearch();
        } catch (error) { alert('Erro ao salvar no banco.'); }
    };

    const handleSaveFromApi = (novel) => {
        enviarParaLaravel({
            title: novel.title.romaji,
            cover_image: novel.coverImage.extraLarge,
            description: novel.description ? novel.description.replace(/<[^>]+>/g, '') : 'Sem sinopse disponível.',
            type: novel.format || 'Novel',
            status: novel.status || 'Concluído',
            is_adult: novel.isAdult || false,
            genres: JSON.stringify(novel.genres || []),
            total_chapters: novel.chapters || 0
        });
    };

    const resetForm = () => { setShowForm(false); setEditingId(null); setManualTitle(''); setManualCover(''); setManualDesc(''); setManualSourceUrl('');};
    const openCreate = () => { resetForm(); setShowForm(true); };
    
    const openEdit = (work) => {
        setEditingId(work.id); setManualTitle(work.title || ''); setManualCover(work.cover_url || ''); setManualDesc(work.synopsis || ''); setManualSourceUrl(work.source_url || ''); setShowForm(true);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        const dados = { 
            title: manualTitle, 
            cover_image: manualCover, 
            description: manualDesc,
            source_url: manualSourceUrl 
        };
        
        if (editingId) {
            try { await updateWork(editingId, dados); await fetchMyNovels(); } catch (error) { alert('Erro ao atualizar.'); return; }
        } else { await enviarParaLaravel(dados); }
        resetForm();
    };

    const confirmDelete = async () => {
        try { await deleteWork(workToDelete.id); setWorkToDelete(null); await fetchMyNovels(); } catch (error) { alert('Erro ao excluir.'); }
    };

    if (viewingChaptersWork) {
        return (
            <TelaCapitulos 
                work={viewingChaptersWork} 
                onBack={() => setViewingChaptersWork(null)} 
            />
        );
    }


    // ---------------- INTERFACE ----------------
    return (
        <>
           
            <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 20px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <img src="/logo.png" alt="LoreDex" style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '50%', padding: '5px' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '36px' }}>Lore<span style={{ color: '#6366f1' }}>Dex</span></h1>
                        <p style={{ margin: 0, color: '#94a3b8' }}>Sua biblioteca inteligente.</p>
                    </div>
                </div>

                {/* AREA: ADICIONAR NOVA OBRA */}
                <header className="add-box">
                    <label style={{ display: 'block', color: '#a5b4fc', fontSize: '15px', fontWeight: '700', margin: '0 0 14px 0' }}>
                        Adicionar nova obra
                    </label>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flex: 1, minWidth: '250px', position: 'relative' }}>
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Pesquisar no AniList (Ex: Solo Leveling)..." 
                                value={searchQuery} 
                                onChange={handleSearchChange} 
                            />
                            {searchQuery && (
                                <button className="clear-search" onClick={clearSearch} title="Limpar busca">✕</button>
                            )}
                        </div>
                        <button className={`chip ${showAdult ? 'active' : ''}`} onClick={toggleAdult} style={{ padding: '12px 18px' }}>
                            🔞 {showAdult ? 'Mostrando +18' : 'Mostrar +18'}
                        </button>
                        <span style={{ color: '#64748b' }}>ou</span>
                        <button className="btn-secondary" onClick={openCreate}>+ Cadastro Manual</button>
                    </div>
                </header>

                {/* FILTRO DA BIBLIOTECA */}
                <div className="filter-bar" role="search">
                    <div className="filter-label"><Icons.Library /> Filtrar Minha Biblioteca</div>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', marginBottom: '12px' }}>
                        <input type="text" placeholder="Buscar por título ou sinopse..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                        
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="padrao">Ordem padrão</option>
                            <option value="az">Título A–Z</option>
                            <option value="za">Título Z–A</option>
                            <option value="recentes">Mais recentes</option>
                        </select>

                        <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)}>
                            <option value="todos">Qualquer Formato</option>
                            <option value="NOVEL">Novel</option>
                            <option value="MANGA">Manga</option>
                        </select>

                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="todos">Qualquer Estado</option>
                            <option value="RELEASING">A Lançar</option>
                            <option value="FINISHED">Concluído</option>
                        </select>

                        <button className={`chip ${libraryShowAdult ? 'active' : ''}`} onClick={() => setLibraryShowAdult(!libraryShowAdult)}>
                            🔞 {libraryShowAdult ? 'A Mostrar +18' : 'Ocultar +18'}
                        </button>

                        {(filterText || sortBy !== 'padrao' || libraryShowAdult || filterFormat !== 'todos' || filterStatus !== 'todos' || selectedGenres.length > 0) && (
                            <button className="link-btn" onClick={clearFilters}>Limpar filtros</button>
                        )}
                    </div>

                    {/* SELEÇÃO MÚLTIPLA DE GÊNEROS */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', marginRight: '4px' }}>Gêneros:</span>
                        {availableGenres.map(g => (
                            <button
                                key={g}
                                className={`chip ${selectedGenres.includes(g) ? 'active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => {
                                    setSelectedGenres(prev => 
                                        prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                                    );
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RESULTADOS DA API (AniList) */}
                {searchResults.length > 0 && (
                    <div style={{ marginBottom: '50px', padding: '24px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid #6366f1', borderRadius: '20px' }}>
                        <h2 style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icons.Search /> Resultados da internet
                        </h2>
                        <div className="carousel">
                            {searchResults.map((novel) => (
                                <article key={novel.id} className="loredex-card carousel-item">
                                    <div className="cover">
                                        <img src={novel.coverImage.extraLarge} alt={`Capa de ${novel.title.romaji}`} />
                                        <div className="badges">
                                            <span className="badge type">{novel.format || 'Novel'}</span>
                                        </div>
                                    </div>
                                    <div className="card-content">
                                        <h4>{novel.title.romaji}</h4>
                                        <button className="btn-save" onClick={() => handleSaveFromApi(novel)}>+ Adicionar</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {/* CARROSSÉIS DA BIBLIOTECA */}
                {sections.map((s) => (
                    <CarouselSection
                        key={s.title} title={s.title} icon={s.icon} works={s.works} loading={loadingMyWorks}
                        onEdit={openEdit} onDelete={setWorkToDelete} onClickWork={setWorkDetails}
                    />
                ))}

                {noResults && (
                    <p className="empty" style={{ textAlign: 'center', padding: '40px 0', fontSize: '16px' }}>
                        Nenhuma obra corresponde aos filtros na sua biblioteca. <button className="link-btn" onClick={clearFilters}>Limpar filtros</button>
                    </p>
                )}

                {/* ---------------- MODAIS ---------------- */}

                {/* 1. NOVO MODAL: PÁGINA DE DETALHES DA OBRA */}
                {workDetails && (
                    <div className="modal-bg" onClick={() => setWorkDetails(null)}>
                        <div className="modal details-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setWorkDetails(null)} style={{ background: 'rgba(15,23,42,0.8)', padding: '6px', borderRadius: '50%', zIndex: 10 }}>✕</button>
                            
                            <div className="details-cover-container">
                                <img src={workDetails.cover_url || PLACEHOLDER} alt="Capa da Obra" />
                            </div>
                            
                            <div className="details-info">
                                <h2>{workDetails.title}</h2>
                                
                                <div className="badges-row">
                                    {workDetails.type && <span className="badge type">{workDetails.type}</span>}
                                    {workDetails.status && <span className="badge status">{workDetails.status}</span>}
                                </div>
                                
                                <div className="details-synopsis">
                                    <h4 style={{ margin: '0 0 10px 0', color: '#a5b4fc', textTransform: 'uppercase', fontSize: '12px' }}>Sinopse</h4>
                                    <p style={{ margin: 0 }}>
                                        {workDetails.synopsis || workDetails.description || 'Nenhuma sinopse ou descrição cadastrada para esta obra.'}
                                    </p>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                                        <button
                                        className="btn-primary"
                                        style={{ width: '100%', fontSize: '16px' }}
                                        onClick={() => {
                                            setViewingChaptersWork(workDetails);
                                            setWorkDetails(null);
                                        }}
                                    >
                                        Avaliar Obra
                                        </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MODAL: CADASTRO / EDIÇÃO */}
                {showForm && (
                    <div className="modal-bg" onClick={resetForm}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar obra' : 'Cadastro Manual'}</h2>
                            <form onSubmit={handleSubmitForm}>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>Título da Novel</label>
                                    <input type="text" required className="form-input" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>URL da Capa (Opcional)</label>
                                    <input type="text" className="form-input" value={manualCover} onChange={(e) => setManualCover(e.target.value)} placeholder="https://link.com/foto.jpg" />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>URL dos Capítulos (Opcional)</label>
                                    <input type="text" className="form-input" value={manualSourceUrl} onChange={(e) => setManualSourceUrl(e.target.value)} placeholder="Ex: https://novelfull.com/reverend-insanity.html" />
                                </div>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>Descrição / Sinopse</label>
                                    <textarea required className="form-input" rows="4" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}></textarea>
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                    {editingId ? 'Salvar alterações' : 'Salvar no Banco'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. MODAL: CONFIRMAR EXCLUSÃO */}
                {workToDelete && (
                    <div className="modal-bg" onClick={() => setWorkToDelete(null)}>
                        <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                            <h2 style={{ marginTop: 0 }}>Excluir obra?</h2>
                            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                                "{workToDelete.title}" será removida da sua biblioteca. Essa ação não pode ser desfeita.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button className="btn-secondary" onClick={() => setWorkToDelete(null)}>Cancelar</button>
                                <button className="btn-danger" onClick={confirmDelete}>Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function App() {
    const [logged, setLogged] = useState(!!getToken());
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erro ao sair:', error);
        } finally {
            setLogged(false);
            setShowLogoutConfirm(false);
            setView('home');
        }
    };

    useEffect(() => {
        if (logged) {
            getMe().then(setUser).catch(async () => { await logout(); setLogged(false); });
        } else {
            setUser(null);
        }
    }, [logged]);

    if (!logged) return <Login onSuccess={() => setLogged(true)} />;

    const isAdmin = user?.role === 'admin';

    return (
        <>
            <UserMenu
                user={user}
                isAdmin={isAdmin}
                view={view}
                onToggleAdmin={() => setView(view === 'admin' ? 'home' : 'admin')}
                onLogout={() => setShowLogoutConfirm(true)}
            />

            {view === 'admin' && isAdmin
                ? <AdminPanel currentUserId={user.id} />
                : <Home isAdmin={isAdmin} />}

            {showLogoutConfirm && (
                <div
                    className="logout-overlay"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="logout-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="logout-title">
                            Sair do LoreDex?
                        </h2>

                        <p className="logout-text">
                            Tem certeza que deseja sair da sua conta?
                        </p>

                        <div className="logout-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancelar
                            </button>

                            <button
                                className="btn-danger"
                                onClick={handleLogout}
                            >
                                Sim, sair
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}