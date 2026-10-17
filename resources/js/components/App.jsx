import React, { useEffect, useMemo, useState, useRef } from 'react';
import Login from '../pages/Login';
import {
    getWorks,
    createWork,
    updateWork,
    deleteWork,
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addWorkToCollection,
    removeWorkFromCollection,
    getToken,
    logout,
} from '../services/api';

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

function Home() {
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

    const [workToDelete, setWorkToDelete] = useState(null);
    
    // Novo estado para a Página de Detalhes
    const [workDetails, setWorkDetails] = useState(null);

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
                        id title { romaji } coverImage { extraLarge } description(asHtml: false) format status isAdult genres
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
            genres: JSON.stringify(novel.genres || [])
        });
    };

    const resetForm = () => { setShowForm(false); setEditingId(null); setManualTitle(''); setManualCover(''); setManualDesc(''); };
    const openCreate = () => { resetForm(); setShowForm(true); };
    
    const openEdit = (work) => {
        setEditingId(work.id); setManualTitle(work.title || ''); setManualCover(work.cover_url || ''); setManualDesc(work.synopsis || ''); setShowForm(true);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        const dados = { title: manualTitle, cover_image: manualCover, description: manualDesc };
        if (editingId) {
            try { await updateWork(editingId, dados); await fetchMyNovels(); } catch (error) { alert('Erro ao atualizar.'); return; }
        } else { await enviarParaLaravel(dados); }
        resetForm();
    };

    const confirmDelete = async () => {
        try { await deleteWork(workToDelete.id); setWorkToDelete(null); await fetchMyNovels(); } catch (error) { alert('Erro ao excluir.'); }
    };

    // ---------------- INTERFACE ----------------
    return (
        <>
            <style>{`
                * { box-sizing: border-box; }
                body { background: radial-gradient(1200px 600px at 20% -10%, #2e2a6b 0%, transparent 60%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); background-attachment: fixed; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; margin: 0; min-height: 100vh; }

                /* Botões e Inputs Básicos */
                .btn-primary { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .btn-primary:hover { background: #4f46e5; }
                .btn-secondary { background: transparent; color: #a5b4fc; padding: 12px 24px; border: 1px solid #6366f1; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .btn-secondary:hover { background: rgba(99, 102, 241, 0.15); }
                .btn-danger { background: #ef4444; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .btn-danger:hover { background: #dc2626; }
                .btn-save { background: #10b981; color: white; padding: 10px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; margin-top: auto; transition: 0.2s; }
                .btn-save:hover { background: #059669; }
                
                .add-box { background: rgba(30, 41, 59, 0.7); padding: 24px 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 28px; }
                .search-input { width: 100%; padding: 14px 45px 14px 18px; border-radius: 12px; border: 1px solid #475569; background: rgba(15, 23, 42, 0.8); color: white; font-size: 15px; transition: border 0.2s; }
                .search-input:focus { border-color: #6366f1; outline: none; }
                .clear-search { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; padding: 4px 8px; border-radius: 50%; }
                .clear-search:hover { color: white; background: rgba(255,255,255,0.1); }
                .form-input { width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; }

                /* Filtro da Biblioteca */
                .filter-bar { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 36px; padding: 18px 20px; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(165, 180, 252, 0.3); border-radius: 16px; backdrop-filter: blur(6px); }
                .filter-label { width: 100%; color: #a5b4fc; font-size: 14px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                .filter-bar input, .filter-bar select { padding: 10px 14px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 14px; }
                .filter-bar input { flex: 1; min-width: 200px; }
                
                .chip { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 999px; border: 1px solid #475569; background: transparent; color: #cbd5e1; font-size: 13px; cursor: pointer; transition: 0.2s; }
                .chip:hover { border-color: #818cf8; }
                .chip.active { background: #6366f1; border-color: #6366f1; color: white; }
                .link-btn { background: none; border: none; color: #a5b4fc; cursor: pointer; font-size: 13px; text-decoration: underline; }

                /* Seções e Carrossel */
                .section { margin-bottom: 44px; }
                .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 10px; }
                .section-title { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0; color: #f1f5f9; }
                .section-icon { display: flex; align-items: center; color: #6366f1; }
                .section-count { font-size: 12px; font-weight: 600; color: #a5b4fc; background: rgba(99, 102, 241, 0.18); padding: 3px 10px; border-radius: 999px; }
                
                .carousel-container { position: relative; display: flex; align-items: center; }
                .carousel { display: flex; overflow-x: auto; gap: 22px; scroll-snap-type: x mandatory; padding: 6px 4px 20px; scroll-behavior: smooth; width: 100%; }
                .carousel::-webkit-scrollbar { height: 8px; }
                .carousel::-webkit-scrollbar-track { background: transparent; }
                .carousel::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                .carousel:hover::-webkit-scrollbar-thumb { background: #475569; }
                .carousel-item { min-width: 220px; max-width: 220px; scroll-snap-align: start; flex-shrink: 0; }
                
                .scroll-btn { position: absolute; z-index: 10; top: 35%; transform: translateY(-50%); width: 44px; height: 44px; background: rgba(15, 23, 42, 0.85); border: 1px solid #475569; color: white; border-radius: 50%; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                .scroll-btn:hover { background: #6366f1; border-color: #6366f1; }
                .scroll-btn.left { left: -50px; }
                .scroll-btn.right { right: -50px; }
                @media (hover: none) { .scroll-btn { display: none; } }

                /* Cards */
                .loredex-card { position: relative; background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 6px 18px rgba(0,0,0,0.25); transition: 0.3s ease; cursor: pointer; }
                .loredex-card:hover, .loredex-card:focus-within { transform: translateY(-8px); box-shadow: 0 18px 36px rgba(0,0,0,0.55), 0 0 0 1px #6366f1; border-color: #6366f1; }
                .cover { position: relative; height: 300px; overflow: hidden; background: #0f172a; }
                .cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
                .loredex-card:hover .cover img { transform: scale(1.06); }
                
                .badges { position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 6px; z-index: 2; pointer-events: none; }
                .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px); }
                .badge.type { background: rgba(99, 102, 241, 0.85); color: white; border: 1px solid rgba(255,255,255,0.2); }
                .badge.status { background: rgba(15, 23, 42, 0.75); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }

                .card-content { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; border-top: 2px solid #334155; }
                .card-content h3, .card-content h4 { margin: 0 0 8px 0; font-size: 16px; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .card-content p { color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.45; }

                /* Ações do Card */
                .card-actions { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; padding: 14px; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.55) 45%, transparent 100%); opacity: 0; transition: opacity 0.25s ease; z-index: 3; }
                .loredex-card:hover .card-actions { opacity: 1; }
                .action-btn { width: 100%; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; border: 1px solid transparent; color: white; transform: translateY(10px); transition: 0.25s ease; backdrop-filter: blur(4px); }
                .loredex-card:hover .action-btn { transform: translateY(0); }
                .action-btn.edit { background: rgba(99, 102, 241, 0.9); }
                .action-btn.edit:hover { background: #4f46e5; }
                .action-btn.delete { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.7); color: #fca5a5; }
                .action-btn.delete:hover { background: #ef4444; color: white; }
                @media (hover: none) { .card-actions { opacity: 1; background: linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%); } .action-btn { transform: none; } }

                .skeleton { height: 420px; border-radius: 18px; background: linear-gradient(90deg, #1e293b 25%, #273449 50%, #1e293b 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
                @keyframes shimmer { to { background-position: -200% 0; } }

                /* Modais Base */
                .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
                .modal { background: #1e293b; padding: 36px; border-radius: 24px; width: 100%; max-width: 500px; position: relative; border: 1px solid #475569; }
                .modal-close { position: absolute; top: 18px; right: 18px; background: transparent; color: #94a3b8; border: none; cursor: pointer; font-size: 20px; }
                
                /* Modal da Página de Detalhes (Nova interface estilo MyAnimeList) */
                .details-modal { max-width: 800px; padding: 0; overflow: hidden; display: flex; }
                .details-cover-container { width: 300px; position: relative; flex-shrink: 0; }
                .details-cover-container img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 400px; }
                .details-info { padding: 36px; flex-grow: 1; display: flex; flex-direction: column; max-height: 600px; overflow-y: auto; }
                .details-info h2 { margin: 0 0 16px 0; font-size: 28px; line-height: 1.2; color: #f8fafc; }
                .details-info .badges-row { display: flex; gap: 10px; margin-bottom: 24px; position: relative; inset: auto; }
                .details-synopsis { color: #cbd5e1; line-height: 1.7; font-size: 15px; background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                
                /* Estilo da barra de rolagem interna na sinopse/info */
                .details-info::-webkit-scrollbar { width: 8px; }
                .details-info::-webkit-scrollbar-track { background: transparent; }
                .details-info::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

                /* Responsividade para o Modal de Detalhes */
                @media (max-width: 700px) {
                    .details-modal { flex-direction: column; }
                    .details-cover-container { width: 100%; height: 250px; }
                    .details-info { padding: 24px; }
                }
            `}</style>

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
                                    <button className="btn-primary" style={{ width: '100%', fontSize: '16px' }} onClick={() => alert("Em breve: Ir para a tela de Capítulos!")}>
                                        📖 Ver Capítulos
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

function Collections() {
    const [collections, setCollections] = useState([]);
    const [works, setWorks] = useState([]);
    const [activeCollectionId, setActiveCollectionId] = useState(null);
    const [workIdToAdd, setWorkIdToAdd] = useState('');
    const [workSearch, setWorkSearch] = useState('');
    const [collectionTags, setCollectionTags] = useState('');
    const [openCollectionMenuId, setOpenCollectionMenuId] = useState(null);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    const [addMode, setAddMode] = useState('library');
    const [aniListQuery, setAniListQuery] = useState('');
    const [aniListResults, setAniListResults] = useState([]);
    const [aniListSearched, setAniListSearched] = useState(false);
    const [searchingAniList, setSearchingAniList] = useState(false);
    const [manualWork, setManualWork] = useState({
        title: '',
        cover_image: '',
        description: '',
        type: 'novel',
    });
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');
    const [collectionSearch, setCollectionSearch] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadCollections = async () => {
            try {
                const [savedCollections, savedWorks] = await Promise.all([
                    getCollections(),
                    getWorks(),
                ]);

                if (isMounted) {
                    setCollections(savedCollections);
                    setWorks(savedWorks);
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError.message || 'Não foi possível carregar suas coleções.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadCollections();

        return () => {
            isMounted = false;
        };
    }, []);

    const activeCollection = collections.find((collection) => collection.id === activeCollectionId);
    const filteredCollections = collections.filter((collection) => {
        const search = collectionSearch.trim().toLocaleLowerCase();
        return !search
            || collection.name.toLocaleLowerCase().includes(search)
            || (collection.description || '').toLocaleLowerCase().includes(search)
            || (collection.tags || []).some((tag) => tag.toLocaleLowerCase().includes(search));
    });
    const orderedCollections = [...filteredCollections].sort(
        (first, second) => Number(second.is_pinned) - Number(first.is_pinned),
    );
    const filteredCollectionWorks = (activeCollection?.works || []).filter((work) => {
        const search = workSearch.trim().toLocaleLowerCase();
        return !search
            || (work.title || '').toLocaleLowerCase().includes(search)
            || (work.synopsis || '').toLocaleLowerCase().includes(search);
    });
    const availableWorks = works.filter(
        (work) => !activeCollection?.works.some((collectionWork) => collectionWork.id === work.id),
    );

    const handleCreateCollection = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            const collection = await createCollection({
                name: collectionName.trim(),
                description: collectionDescription.trim() || null,
            });

            setCollections((current) => [collection, ...current]);
            setCollectionName('');
            setCollectionDescription('');
            setShowCreateForm(false);
        } catch (createError) {
            setError(createError.message || 'Não foi possível criar a coleção.');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePinned = async (collection) => {
        setSaving(true);
        setError('');

        try {
            const updatedCollection = await updateCollection(collection.id, {
                is_pinned: !collection.is_pinned,
            });
            setCollections((current) => current.map(
                (item) => item.id === updatedCollection.id ? updatedCollection : item,
            ));
            setOpenCollectionMenuId(null);
        } catch (updateError) {
            setError(updateError.message || 'Não foi possível atualizar os favoritos.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCollection = async () => {
        if (!collectionToDelete) return;

        setSaving(true);
        setError('');

        try {
            await deleteCollection(collectionToDelete.id);
            setCollections((current) => current.filter((item) => item.id !== collectionToDelete.id));
            setOpenCollectionMenuId(null);
            setCollectionToDelete(null);
        } catch (deleteError) {
            setError(deleteError.message || 'Não foi possível excluir a coleção.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTags = async (event) => {
        event.preventDefault();
        if (!activeCollection) return;

        setSaving(true);
        setError('');

        try {
            const tags = [...new Set(collectionTags.split(',').map((tag) => tag.trim()).filter(Boolean))];
            const updatedCollection = await updateCollection(activeCollection.id, { tags });
            setCollections((current) => current.map(
                (item) => item.id === updatedCollection.id ? updatedCollection : item,
            ));
            setCollectionTags((updatedCollection.tags || []).join(', '));
        } catch (updateError) {
            setError(updateError.message || 'Não foi possível salvar as etiquetas.');
        } finally {
            setSaving(false);
        }
    };

    const handleExportCollection = () => {
        if (!activeCollection) return;

        const escapeCsv = (value) => {
            const cell = String(value ?? '');
            const safeCell = /^[\t\r=+\-@]/.test(cell) ? `'${cell}` : cell;
            return `"${safeCell.replace(/"/g, '""')}"`;
        };
        const rows = [
            ['Título', 'Formato', 'Status', 'Sinopse', 'URL da capa'],
            ...activeCollection.works.map((work) => [
                work.title,
                work.type,
                work.status,
                work.synopsis,
                work.cover_url,
            ]),
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        const filename = activeCollection.name
            .trim()
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
            .replace(/\s+/g, '-');

        link.href = url;
        link.download = `${filename || 'colecao'}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleAddWork = async (event) => {
        event.preventDefault();
        if (!activeCollection || !workIdToAdd) return;

        setSaving(true);
        setError('');

        try {
            const updatedCollection = await addWorkToCollection(activeCollection.id, workIdToAdd);
            setCollections((current) => current.map(
                (collection) => collection.id === updatedCollection.id ? updatedCollection : collection,
            ));
            setWorkIdToAdd('');
        } catch (addError) {
            setError(addError.message || 'Não foi possível adicionar a obra.');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchAniList = async (event) => {
        event.preventDefault();
        if (!aniListQuery.trim()) return;

        setSearchingAniList(true);
        setError('');

        const query = `
            query ($search: String) {
                Page(page: 1, perPage: 8) {
                    media(search: $search, type: MANGA, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
                        id
                        title { romaji english }
                        coverImage { extraLarge large }
                        description(asHtml: false)
                        format
                        status
                    }
                }
            }
        `;

        try {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ query, variables: { search: aniListQuery.trim() } }),
            });
            const result = await response.json();

            if (!response.ok || result.errors?.length) {
                throw new Error(result.errors?.[0]?.message || 'Não foi possível pesquisar no AniList.');
            }

            setAniListResults(result.data?.Page?.media || []);
            setAniListSearched(true);
        } catch (searchError) {
            setError(searchError.message || 'Não foi possível pesquisar no AniList.');
        } finally {
            setSearchingAniList(false);
        }
    };

    const handleCreateAndAddWork = async (workData) => {
        if (!activeCollection) return;

        setSaving(true);
        setError('');

        try {
            const createdWork = await createWork(workData);
            setWorks((current) => [createdWork, ...current.filter((work) => work.id !== createdWork.id)]);

            try {
                const updatedCollection = await addWorkToCollection(activeCollection.id, createdWork.id);
                setCollections((current) => current.map(
                    (collection) => collection.id === updatedCollection.id ? updatedCollection : collection,
                ));
                setAniListResults((current) => current.filter((novel) => novel.id !== workData.anilist_id));
                setManualWork({ title: '', cover_image: '', description: '', type: 'novel' });
            } catch (addError) {
                setError(`${addError.message || 'A obra foi salva, mas não foi adicionada à coleção.'} A obra foi salva na biblioteca; tente adicioná-la pelo campo "Minha biblioteca".`);
            }
        } catch (createError) {
            setError(createError.message || 'Não foi possível salvar a obra.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAniListWork = (novel) => {
        handleCreateAndAddWork({
            title: novel.title.romaji || novel.title.english || 'Obra sem título',
            cover_image: novel.coverImage.extraLarge || novel.coverImage.large || '',
            description: novel.description ? novel.description.replace(/<[^>]+>/g, '') : '',
            type: novel.format || 'novel',
            status: novel.status || 'ongoing',
        });
    };

    const handleCreateManualWork = (event) => {
        event.preventDefault();
        handleCreateAndAddWork(manualWork);
    };

    const handleRemoveWork = async (workId) => {
        setSaving(true);
        setError('');

        try {
            const updatedCollection = await removeWorkFromCollection(activeCollection.id, workId);
            setCollections((current) => current.map(
                (collection) => collection.id === updatedCollection.id ? updatedCollection : collection,
            ));
        } catch (removeError) {
            setError(removeError.message || 'Não foi possível remover a obra da coleção.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', color: '#f8fafc' }}>
            <style>{`
                .collection-card:hover { border-color: #818cf8 !important; }
                .collection-work-row { display: flex; align-items: center; gap: 14px; }
                @media (max-width: 600px) {
                    .collection-work-row { align-items: flex-start; }
                    .collection-work-row button { margin-left: auto; }
                }
            `}</style>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    {activeCollection ? (
                        <>
                            <h1 style={{ margin: 0, fontSize: '30px' }}>{activeCollection.name}</h1>
                            {activeCollection.description && (
                                <p style={{ color: '#cbd5e1', margin: '8px 0 0' }}>{activeCollection.description}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 style={{ margin: 0, fontSize: '30px' }}>Minhas coleções</h1>
                            <p style={{ color: '#cbd5e1', margin: '8px 0 0' }}>
                                Crie ou pesquise suas coleções.
                            </p>
                        </>
                    )}
                </div>
                {activeCollection ? (
                    <button className="btn-secondary" type="button" onClick={() => {
                        setActiveCollectionId(null);
                        setError('');
                    }}>
                        ← Voltar às coleções
                    </button>
                ) : (
                    <button className="btn-primary" type="button" onClick={() => setShowCreateForm(true)}>
                        + Nova coleção
                    </button>
                )}
            </header>

            {error && (
                <p role="alert" style={{ color: '#fecaca', background: 'rgba(127, 29, 29, .35)', padding: '12px 16px', borderRadius: '10px', marginTop: '24px' }}>
                    {error}
                </p>
            )}

            {loading ? (
                <p style={{ color: '#cbd5e1', marginTop: '32px' }}>Carregando coleções...</p>
            ) : (
                <>
                    {!activeCollection && (
                        <label style={{ display: 'block', marginTop: '28px' }}>
                            <span style={{ display: 'block', color: '#a5b4fc', fontWeight: 600, marginBottom: '8px' }}>
                                Buscar coleção
                            </span>
                            <input
                                type="search"
                                aria-label="Buscar coleções"
                                className="form-input"
                                placeholder="Digite o nome ou a descrição da coleção..."
                                value={collectionSearch}
                                onChange={(event) => setCollectionSearch(event.target.value)}
                                style={{ margin: 0 }}
                            />
                        </label>
                    )}

                    {!activeCollection && filteredCollections.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px', marginTop: '32px' }}>
                            {orderedCollections.map((collection) => {
                                const covers = collection.works
                                    .filter((work) => work.cover_url)
                                    .slice(0, 3);

                                return (
                                    <div
                                        key={collection.id}
                                        style={{ position: 'relative' }}
                                    >
                                        <button
                                            className="collection-card"
                                            type="button"
                                            onClick={() => {
                                                setActiveCollectionId(collection.id);
                                                setWorkIdToAdd('');
                                                setWorkSearch('');
                                                setCollectionTags((collection.tags || []).join(', '));
                                                setAddMode('library');
                                                setAniListQuery('');
                                                setAniListResults([]);
                                                setAniListSearched(false);
                                                setError('');
                                            }}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                textAlign: 'left',
                                                color: '#f8fafc',
                                                cursor: 'pointer',
                                                padding: 0,
                                                borderRadius: '14px',
                                                border: '1px solid rgba(165, 180, 252, .25)',
                                                background: 'rgba(30, 41, 59, .7)',
                                                width: '100%',
                                            }}
                                        >
                                            <div
                                                aria-hidden="true"
                                                    style={{
                                                        position: 'relative',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        overflow: 'hidden',
                                                        width: '100%',
                                                        height: '180px',
                                                        background: '#0f172a',
                                                    }}
                                            >
                                                {covers.length > 0 ? covers.map((work, index) => (
                                                    <img
                                                        key={work.id}
                                                        src={work.cover_url}
                                                        alt=""
                                                        loading="lazy"
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${index * 12}%`,
                                                            zIndex: covers.length - index,
                                                            width: covers.length === 1 ? '100%' : '76%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            objectPosition: 'center 25%',
                                                            borderRadius: covers.length === 1 ? 0 : '8px',
                                                            boxShadow: covers.length === 1 ? 'none' : '0 4px 14px rgba(0, 0, 0, .45)',
                                                        }}
                                                    />
                                                )) : (
                                                    <img
                                                        src={PLACEHOLDER}
                                                        alt=""
                                                        loading="lazy"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                            <span style={{ display: 'block', padding: '16px 18px 18px' }}>
                                                <strong style={{ display: 'block', fontSize: '16px' }}>{collection.name}</strong>
                                                <span style={{ display: 'block', marginTop: '8px', color: '#a5b4fc', fontSize: '13px' }}>
                                                    {collection.works.length} {collection.works.length === 1 ? 'obra' : 'obras'}
                                                </span>
                                                {(collection.tags || []).length > 0 && (
                                                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                                        {collection.tags.slice(0, 3).map((tag) => (
                                                            <span key={tag} style={{ color: '#cbd5e1', background: 'rgba(99, 102, 241, .2)', borderRadius: '999px', padding: '3px 8px', fontSize: '11px' }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Mais opções para ${collection.name}`}
                                            aria-haspopup="menu"
                                            aria-expanded={openCollectionMenuId === collection.id}
                                            title="Mais opções"
                                            onClick={() => setOpenCollectionMenuId(
                                                openCollectionMenuId === collection.id ? null : collection.id,
                                            )}
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                zIndex: 2,
                                                border: '1px solid rgba(255,255,255,.35)',
                                                borderRadius: '999px',
                                                padding: '7px 10px',
                                                color: 'white',
                                                background: 'rgba(15, 23, 42, .88)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <span aria-hidden="true" style={{ fontSize: '20px', lineHeight: 1 }}>⋮</span>
                                        </button>
                                        {openCollectionMenuId === collection.id && (
                                            <div
                                                role="menu"
                                                aria-label={`Opções de ${collection.name}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: '48px',
                                                    right: '10px',
                                                    zIndex: 3,
                                                    minWidth: '190px',
                                                    padding: '6px',
                                                    border: '1px solid #475569',
                                                    borderRadius: '10px',
                                                    background: '#1e293b',
                                                    boxShadow: '0 12px 28px rgba(0, 0, 0, .4)',
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    disabled={saving}
                                                    onClick={() => handleTogglePinned(collection)}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        textAlign: 'left',
                                                        color: '#f8fafc',
                                                        border: 0,
                                                        borderRadius: '7px',
                                                        background: 'transparent',
                                                        cursor: saving ? 'wait' : 'pointer',
                                                    }}
                                                >
                                                    {collection.is_pinned ? '★ Remover dos favoritos' : '☆ Favoritar coleção'}
                                                </button>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => {
                                                        setCollectionToDelete(collection);
                                                        setOpenCollectionMenuId(null);
                                                    }}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        textAlign: 'left',
                                                        color: '#fca5a5',
                                                        border: 0,
                                                        borderRadius: '7px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Excluir coleção
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeCollection && (
                        <section style={{ marginTop: '28px', padding: '24px', border: '1px solid rgba(165, 180, 252, .2)', borderRadius: '16px', background: 'rgba(15, 23, 42, .55)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                <form onSubmit={handleSaveTags} style={{ display: 'flex', alignItems: 'center', flex: '1 1 360px', flexWrap: 'wrap', gap: '10px' }}>
                                    <label htmlFor="collection-tags" style={{ color: '#a5b4fc', fontWeight: 600 }}>
                                        Etiquetas
                                    </label>
                                    <input
                                        id="collection-tags"
                                        type="text"
                                        maxLength={310}
                                        className="form-input"
                                        placeholder="Ex.: Fantasia, Ler depois"
                                        value={collectionTags}
                                        onChange={(event) => setCollectionTags(event.target.value)}
                                        style={{ flex: '1 1 200px', margin: 0 }}
                                    />
                                    <button className="btn-secondary" type="submit" disabled={saving} style={{ padding: '9px 14px' }}>
                                        Salvar etiquetas
                                    </button>
                                </form>
                                <button
                                    className="btn-secondary"
                                    type="button"
                                    onClick={handleExportCollection}
                                    disabled={activeCollection.works.length === 0}
                                    style={{ padding: '9px 14px' }}
                                >
                                    Exportar CSV
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '24px' }}>
                                {[
                                    ['library', 'Minha biblioteca'],
                                    ['anilist', 'Buscar no AniList'],
                                    ['manual', 'Cadastro manual'],
                                ].map(([mode, label]) => (
                                    <button
                                        key={mode}
                                        className={addMode === mode ? 'btn-primary' : 'btn-secondary'}
                                        type="button"
                                        aria-pressed={addMode === mode}
                                        onClick={() => {
                                            setAddMode(mode);
                                            setError('');
                                        }}
                                        style={{ padding: '9px 14px' }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {addMode === 'library' && (
                                <form onSubmit={handleAddWork} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                                    <label htmlFor="collection-work" style={{ color: '#a5b4fc', fontWeight: 600 }}>
                                        Escolha uma obra já salva
                                    </label>
                                    <select
                                        id="collection-work"
                                        value={workIdToAdd}
                                        onChange={(event) => setWorkIdToAdd(event.target.value)}
                                        disabled={availableWorks.length === 0 || saving}
                                        style={{ flex: '1 1 240px', minWidth: 0, padding: '11px 14px', borderRadius: '10px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
                                    >
                                        <option value="">
                                            {works.length === 0 ? 'Nenhuma obra salva: busque no AniList ou cadastre uma manualmente' : availableWorks.length === 0 ? 'Todas as obras já estão nesta coleção' : 'Selecione uma obra'}
                                        </option>
                                        {availableWorks.map((work) => (
                                            <option key={work.id} value={work.id}>{work.title}</option>
                                        ))}
                                    </select>
                                    <button className="btn-primary" type="submit" disabled={!workIdToAdd || saving}>
                                        Adicionar à coleção
                                    </button>
                                </form>
                            )}

                            {addMode === 'anilist' && (
                                <div style={{ marginTop: '16px' }}>
                                    <form onSubmit={handleSearchAniList} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <input
                                            aria-label="Pesquisar obras no AniList"
                                            type="search"
                                            className="form-input"
                                            placeholder="Digite o nome de uma obra..."
                                            value={aniListQuery}
                                            onChange={(event) => {
                                                setAniListQuery(event.target.value);
                                                setAniListResults([]);
                                                setAniListSearched(false);
                                            }}
                                            style={{ flex: '1 1 240px', minWidth: 0, marginBottom: 0 }}
                                        />
                                        <button className="btn-primary" type="submit" disabled={!aniListQuery.trim() || searchingAniList || saving}>
                                            {searchingAniList ? 'Pesquisando...' : 'Pesquisar'}
                                        </button>
                                    </form>
                                    {aniListResults.length > 0 && (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: '10px' }}>
                                            {aniListResults.map((novel) => (
                                                <li key={novel.id} className="collection-work-row" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30, 41, 59, .75)' }}>
                                                    <img
                                                        src={novel.coverImage.extraLarge || novel.coverImage.large || PLACEHOLDER}
                                                        alt=""
                                                        style={{ width: '46px', height: '62px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                                    />
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <strong style={{ display: 'block', overflowWrap: 'anywhere' }}>{novel.title.romaji || novel.title.english}</strong>
                                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>{novel.format || 'Manga'} · AniList</span>
                                                    </div>
                                                    <button
                                                        className="btn-primary"
                                                        type="button"
                                                        disabled={saving}
                                                        onClick={() => handleAddAniListWork(novel)}
                                                        style={{ padding: '8px 12px', flexShrink: 0 }}
                                                    >
                                                        Adicionar
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {!searchingAniList && aniListSearched && aniListResults.length === 0 && (
                                        <p style={{ color: '#94a3b8', marginBottom: 0 }}>Nenhuma obra encontrada. Tente outro título.</p>
                                    )}
                                </div>
                            )}

                            {addMode === 'manual' && (
                                <form onSubmit={handleCreateManualWork} style={{ marginTop: '16px' }}>
                                    <label htmlFor="manual-work-title" style={{ color: '#94a3b8' }}>Título</label>
                                    <input
                                        id="manual-work-title"
                                        type="text"
                                        required
                                        maxLength={255}
                                        className="form-input"
                                        value={manualWork.title}
                                        onChange={(event) => setManualWork((current) => ({ ...current, title: event.target.value }))}
                                    />
                                    <label htmlFor="manual-work-type" style={{ color: '#94a3b8' }}>Formato</label>
                                    <select
                                        id="manual-work-type"
                                        className="form-input"
                                        value={manualWork.type}
                                        onChange={(event) => setManualWork((current) => ({ ...current, type: event.target.value }))}
                                    >
                                        <option value="novel">Novel</option>
                                        <option value="manga">Mangá</option>
                                        <option value="webnovel">Web novel</option>
                                    </select>
                                    <label htmlFor="manual-work-cover" style={{ color: '#94a3b8' }}>URL da capa (opcional)</label>
                                    <input
                                        id="manual-work-cover"
                                        type="url"
                                        maxLength={2048}
                                        className="form-input"
                                        placeholder="https://..."
                                        value={manualWork.cover_image}
                                        onChange={(event) => setManualWork((current) => ({ ...current, cover_image: event.target.value }))}
                                    />
                                    <label htmlFor="manual-work-description" style={{ color: '#94a3b8' }}>Sinopse (opcional)</label>
                                    <textarea
                                        id="manual-work-description"
                                        rows="3"
                                        className="form-input"
                                        value={manualWork.description}
                                        onChange={(event) => setManualWork((current) => ({ ...current, description: event.target.value }))}
                                    />
                                    <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                                        {saving ? 'Salvando e adicionando...' : 'Salvar obra e adicionar à coleção'}
                                    </button>
                                </form>
                            )}

                            {activeCollection.works.length > 0 && (
                                <label style={{ display: 'block', marginTop: '24px' }}>
                                    <span style={{ display: 'block', color: '#a5b4fc', fontWeight: 600, marginBottom: '8px' }}>
                                        Buscar nesta coleção
                                    </span>
                                    <input
                                        type="search"
                                        aria-label="Buscar obras nesta coleção"
                                        className="form-input"
                                        placeholder="Buscar por título ou sinopse..."
                                        value={workSearch}
                                        onChange={(event) => setWorkSearch(event.target.value)}
                                        style={{ margin: 0 }}
                                    />
                                </label>
                            )}

                            {filteredCollectionWorks.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: '10px' }}>
                                    {filteredCollectionWorks.map((work) => (
                                        <li key={work.id} className="collection-work-row" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30, 41, 59, .75)' }}>
                                            <img
                                                src={work.cover_url || PLACEHOLDER}
                                                alt=""
                                                style={{ width: '46px', height: '62px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                            />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <strong style={{ display: 'block', overflowWrap: 'anywhere' }}>{work.title}</strong>
                                                {work.type && <span style={{ color: '#94a3b8', fontSize: '13px' }}>{work.type}</span>}
                                            </div>
                                            <button
                                                className="btn-secondary"
                                                type="button"
                                                disabled={saving}
                                                onClick={() => handleRemoveWork(work.id)}
                                                style={{ padding: '8px 12px', flexShrink: 0 }}
                                            >
                                                Remover
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : activeCollection.works.length === 0 ? (
                                <p style={{ color: '#94a3b8', margin: '24px 0 0' }}>Esta coleção ainda não tem obras.</p>
                            ) : (
                                <p style={{ color: '#94a3b8', margin: '24px 0 0' }}>Nenhuma obra corresponde à busca.</p>
                            )}
                        </section>
                    )}

                    {!activeCollection && filteredCollections.length === 0 && (
                        <section style={{ marginTop: '24px', padding: '32px', textAlign: 'center', border: '1px dashed rgba(165, 180, 252, 0.4)', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
                            <h2 style={{ marginTop: 0 }}>
                                {collections.length === 0 ? 'Você ainda não criou coleções' : 'Nenhuma coleção encontrada'}
                            </h2>
                            <p style={{ color: '#cbd5e1', marginBottom: collections.length === 0 ? '20px' : 0 }}>
                                {collections.length === 0
                                    ? 'Crie uma coleção para começar a organizar suas obras.'
                                    : 'Tente buscar por outro nome ou descrição.'}
                            </p>
                            {collections.length === 0 && (
                                <button className="btn-primary" type="button" onClick={() => setShowCreateForm(true)}>
                                    Criar primeira coleção
                                </button>
                            )}
                        </section>
                    )}
                </>
            )}

            {showCreateForm && (
                <div className="modal-bg" onClick={() => setShowCreateForm(false)}>
                    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-collection-title" onClick={(event) => event.stopPropagation()}>
                        <button className="modal-close" type="button" aria-label="Fechar" onClick={() => setShowCreateForm(false)}>✕</button>
                        <h2 id="new-collection-title" style={{ marginTop: 0 }}>Nova coleção</h2>
                        <form onSubmit={handleCreateCollection}>
                            <label htmlFor="collection-name" style={{ color: '#94a3b8' }}>Nome</label>
                            <input
                                id="collection-name"
                                type="text"
                                required
                                maxLength={100}
                                className="form-input"
                                value={collectionName}
                                onChange={(event) => setCollectionName(event.target.value)}
                                autoFocus
                            />
                            <label htmlFor="collection-description" style={{ color: '#94a3b8' }}>Descrição (opcional)</label>
                            <textarea
                                id="collection-description"
                                maxLength={1000}
                                rows="3"
                                className="form-input"
                                value={collectionDescription}
                                onChange={(event) => setCollectionDescription(event.target.value)}
                            />
                            <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                                {saving ? 'Criando...' : 'Criar coleção'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {collectionToDelete && (
                <div className="modal-bg" onClick={() => setCollectionToDelete(null)}>
                    <div
                        className="modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-collection-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            type="button"
                            aria-label="Fechar"
                            onClick={() => setCollectionToDelete(null)}
                        >
                            ✕
                        </button>
                        <h2 id="delete-collection-title" style={{ marginTop: 0 }}>Excluir coleção?</h2>
                        <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
                            A coleção “{collectionToDelete.name}” será excluída. As obras da sua biblioteca não serão apagadas.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button
                                className="btn-secondary"
                                type="button"
                                disabled={saving}
                                onClick={() => setCollectionToDelete(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-danger"
                                type="button"
                                disabled={saving}
                                onClick={handleDeleteCollection}
                            >
                                {saving ? 'Excluindo...' : 'Excluir coleção'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
export default function App() {
    const [logged, setLogged] = useState(!!getToken());
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [pagina, setPagina] = useState('inicio');

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erro ao sair:', error);
        } finally {
            setLogged(false);
            setShowLogoutConfirm(false);
        }
    };

    if (!logged) {
        return <Login onSuccess={() => setLogged(true)} />;
    }

    return (
        <>
            <style>{`
                body { background: radial-gradient(1200px 600px at 20% -10%, #2e2a6b 0%, transparent 60%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); background-attachment: fixed; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; margin: 0; min-height: 100vh; }
                .btn-primary { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .btn-primary:hover { background: #4f46e5; }
                .btn-primary:disabled, .btn-secondary:disabled { opacity: .55; cursor: not-allowed; }
                .btn-secondary { background: transparent; color: #a5b4fc; padding: 12px 24px; border: 1px solid #6366f1; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
                .btn-secondary:hover { background: rgba(99, 102, 241, 0.15); }
                .form-input { width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; }
                .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
                .modal { background: #1e293b; padding: 36px; border-radius: 24px; width: 100%; max-width: 500px; position: relative; border: 1px solid #475569; }
                .modal-close { position: absolute; top: 18px; right: 18px; background: transparent; color: #94a3b8; border: none; cursor: pointer; font-size: 20px; }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '25px',
                    zIndex: 500
                }}
            >
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#cbd5e1',
                        border: '1px solid #475569',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: '0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                        e.currentTarget.style.borderColor = '#475569';
                        e.currentTarget.style.color = '#cbd5e1';
                    }}
                >
                    Sair
                </button>
            </div>

            <nav
                aria-label="Navegação principal"
                style={{ display: 'flex', gap: '20px', padding: '20px 25px 0' }}
            >
                <button
                    type="button"
                    onClick={() => setPagina('inicio')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1px solid #6366f2',
                        background: pagina === 'inicio' ? '#6366f2' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Tela inicial
                </button>

                <button
                    type="button"
                    onClick={() => setPagina('colecoes')}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1px solid #6366f2',
                        background: pagina === 'colecoes' ? '#6366f2' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Minhas coleções
                </button>
            </nav>

            {pagina === 'inicio' && <Home />}
            {pagina === 'colecoes' && <Collections />}

            {showLogoutConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            background: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '20px',
                            padding: '30px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            style={{
                                margin: '0 0 12px',
                                color: '#f8fafc',
                                fontSize: '22px'
                            }}
                        >
                            Sair do LoreDex?
                        </h2>

                        <p
                            style={{
                                margin: '0 0 28px',
                                color: '#94a3b8',
                                lineHeight: '1.5'
                            }}
                        >
                            Tem certeza que deseja sair da sua conta?
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px'
                            }}
                        >
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    background: 'transparent',
                                    color: '#a5b4fc',
                                    border: '1px solid #6366f1',
                                    padding: '11px 20px',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleLogout}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '11px 20px',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
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
