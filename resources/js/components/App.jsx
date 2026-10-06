import React, { useEffect, useMemo, useState, useRef } from 'react';
import Login from '../pages/Login';
import { getWorks, createWork, updateWork, deleteWork, getToken, logout } from '../services/api';

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
