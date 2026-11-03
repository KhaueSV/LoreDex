import React, { useEffect, useMemo, useState, useRef } from 'react';
import Login from '../pages/Login';
import AdminPanel from '../pages/AdminPanel';
import '../../css/home.css';
import { getWorks, createWork, updateWork, deleteWork, getToken, logout, getMe, syncWorkMetadata } from '../services/api';
import TelaCapitulos from '../pages/TelaCapitulos';
import UserMenu from './UserMenu';
import WorkRecommendation from '../components/WorkRecommendation';

const PLACEHOLDER = 'https://via.placeholder.com/220x320/0f172a/6366f1?text=Sem+Capa';


// ---------------- DICIONÁRIOS DE TRADUÇÃO (PT-BR) ----------------
export const GENRE_TRANSLATIONS = {
    'Action': 'Ação',
    'Adventure': 'Aventura',
    'Comedy': 'Comédia',
    'Drama': 'Drama',
    'Fantasy': 'Fantasia',
    'Romance': 'Romance',
    'Sci-Fi': 'Ficção Científica',
    'Slice of Life': 'Cotidiano',
    'Mystery': 'Mistério',
    'Horror': 'Terror',
    'Supernatural': 'Sobrenatural',
    'Psychological': 'Psicológico',
    'Sports': 'Esportes',
    'Thriller': 'Suspense',
    'Mecha': 'Mecha',
    'Music': 'Música',
    'Ecchi': 'Ecchi',
    'Mahou Shoujo': 'Garota Mágica',
};

export const translateGenre = (genre) => {
    if (!genre) return '';
    const trimmed = String(genre).trim();
    const matchKey = Object.keys(GENRE_TRANSLATIONS).find(
        (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    return matchKey ? GENRE_TRANSLATIONS[matchKey] : trimmed;
};

export const translateFormat = (type) => {
    const upper = String(type || '').toUpperCase();
    if (upper === 'MANGA') return 'Mangá';
    if (upper === 'NOVEL') return 'Novel';
    if (upper === 'WEBNOVEL') return 'Webnovel';
    if (upper === 'ONE_SHOT') return 'One-Shot';
    return type || 'Novel';
};

export const translateStatus = (status) => {
    const upper = String(status || '').toUpperCase();
    if (['RELEASING', 'ONGOING', 'LANCANDO', 'A LANÇAR'].includes(upper)) return 'Em Lançamento';
    if (['FINISHED', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO'].includes(upper)) return 'Concluído';
    if (['CANCELLED', 'DROPPED', 'CANCELADO'].includes(upper)) return 'Cancelado';
    if (upper === 'HIATUS') return 'Em Hiato';
    if (upper === 'NOT_YET_RELEASED') return 'Não Lançado';
    return status || 'Em Lançamento';
};

export const parseGenres = (genresField) => {
    try {
        if (Array.isArray(genresField)) return genresField;
        if (typeof genresField === 'string' && genresField.trim() !== '') {
            const parsed = JSON.parse(genresField);
            if (Array.isArray(parsed)) return parsed;
            return genresField.split(',').map((s) => s.trim()).filter(Boolean);
        }
    } catch {
        if (typeof genresField === 'string') {
            return genresField.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
};

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
                        {works.map((work) => {
                            const workGenres = parseGenres(work.genres);
                            return (
                                <article key={work.id} className="loredex-card carousel-item" onClick={() => onClickWork(work)}>
                                    <div className="cover">
                                        <img src={work.cover_url || PLACEHOLDER} alt={`Capa de ${work.title}`} />
                                        
                                        <div className="badges">
                                            {work.type && <span className="badge type">{translateFormat(work.type)}</span>}
                                            {work.status && <span className="badge status">{translateStatus(work.status)}</span>}
                                        </div>

                                        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button className="action-btn edit" onClick={() => onEdit(work)}>✎ Editar</button>
                                            <button className="action-btn delete" onClick={() => onDelete(work)}>🗑 Excluir</button>
                                        </div>
                                    </div>
                                    <div className="card-content">
                                        <h3>{work.title}</h3>
                                        {workGenres.length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                {workGenres.slice(0, 3).map((g) => (
                                                    <span
                                                        key={g}
                                                        style={{
                                                            fontSize: '10px',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: 'rgba(99, 102, 241, 0.2)',
                                                            color: '#a5b4fc',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {translateGenre(g)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p>{work.synopsis ? work.synopsis.substring(0, 70) + '...' : 'Sem sinopse.'}</p>
                                    </div>
                                </article>
                            );
                        })}
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
    
    // Filtro múltiplo de Gêneros (guarda a chave em inglês para bater com o AniList/banco, mas exibe em PT-BR)
    const [selectedGenres, setSelectedGenres] = useState([]);
    const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Mystery'];

    // Modais
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [manualTitle, setManualTitle] = useState('');
    const [manualCover, setManualCover] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualSourceUrl, setManualSourceUrl] = useState('');
    const [manualChapters, setManualChapters] = useState('');
    const [manualType, setManualType] = useState('manga');
    const [manualStatus, setManualStatus] = useState('ongoing');
    const [manualGenres, setManualGenres] = useState([]);

    const [workToDelete, setWorkToDelete] = useState(null);
    const [workDetails, setWorkDetails] = useState(null);
    const [viewingChaptersWork, setViewingChaptersWork] = useState(null);
    const [savingWorkKey, setSavingWorkKey] = useState(null);

    const normalizeTitle = (t) => String(t || '').trim().toLowerCase();

    const isNovelInLibrary = (novel) => {
        const romaji = normalizeTitle(novel?.title?.romaji);
        const english = normalizeTitle(novel?.title?.english);
        return allWorks.some((w) => {
            const wTitle = normalizeTitle(w.title);
            return wTitle && (wTitle === romaji || (english && wTitle === english));
        });
    };

    // ---------------- FUNÇÕES BASE ----------------
    const fetchMyNovels = async () => {
        setLoadingMyWorks(true);
        try {
            const data = await getWorks();
            setAllWorks(data);

            // Se alguma obra estiver sem gêneros ou sem capítulos, sincroniza automaticamente em segundo plano
            const needsAutoSync = Array.isArray(data) && data.some(
                (w) => parseGenres(w.genres).length === 0 || Number(w.total_chapters) <= 0
            );
            if (needsAutoSync) {
                syncWorkMetadata()
                    .then((updated) => {
                        if (Array.isArray(updated)) setAllWorks(updated);
                    })
                    .catch(() => {});
            }
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoadingMyWorks(false);
        }
    };

    useEffect(() => { fetchMyNovels(); }, []);

    // ---------------- FILTROS ----------------
    const isFiltering = filterText.trim() !== '' || libraryShowAdult || filterFormat !== 'todos' || filterStatus !== 'todos' || selectedGenres.length > 0 || sortBy !== 'padrao';

    const applyFilter = (list) => {
        const termo = filterText.trim().toLowerCase();
        
        let result = list.filter((w) => {
            // 1. Busca por texto
            const bateTexto = !termo || (w.title || '').toLowerCase().includes(termo) || (w.synopsis || '').toLowerCase().includes(termo);
            
            // 5. Filtro de Gêneros (Suporta nomes em Inglês ou Português salvos no banco)
            const obraGeneros = parseGenres(w.genres);
            const generosNormalized = obraGeneros.flatMap((g) => {
                const upper = String(g).trim().toUpperCase();
                const translated = translateGenre(g).toUpperCase();
                return [upper, translated];
            });

            // 2. Filtro +18 (Verifica flag is_adult, gêneros Hentai/Ecchi/Adult/Smut/Erotica ou menção a hentai na sinopse/título)
            const hasAdultGenre = generosNormalized.some((g) =>
                ['HENTAI', 'ECCHI', 'ADULT', 'ADULTO', 'SMUT', 'EROTICA', '+18'].includes(g)
            );
            const hasAdultText = /\b(hentai|ecchi|\+18|nsfw|erótico|erotico)\b/i.test(
                `${w.title || ''} ${w.synopsis || ''}`
            );
            const isAdultWork =
                w.is_adult === true ||
                w.is_adult === 1 ||
                w.is_adult === '1' ||
                hasAdultGenre ||
                hasAdultText;
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
                bateStatus = ['RELEASING', 'ONGOING', 'LANCANDO', 'A LANÇAR', 'EM LANÇAMENTO'].includes(safeStatus);
            } else if (filterStatus === 'FINISHED') {
                bateStatus = ['FINISHED', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO'].includes(safeStatus);
            } else {
                bateStatus = safeStatus === filterStatus.toUpperCase();
            }
            
            const bateGeneros = selectedGenres.length === 0 || selectedGenres.every((g) => {
                const targetEn = g.toUpperCase();
                const targetPt = translateGenre(g).toUpperCase();
                return generosNormalized.includes(targetEn) || generosNormalized.includes(targetPt);
            });

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
        
        const recentes = [...filteredWorks].sort((a, b) => b.id - a.id).slice(0, 10);
        return [
            { title: 'Adicionados Recentemente', icon: <Icons.Recent />, works: recentes },
            { title: 'Todas as Obras', icon: <Icons.Library />, works: filteredWorks }
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

    // ---------------- TRADUÇÃO E FALLBACK DE CAPÍTULOS ----------------
    // fetch com tempo limite: uma API externa lenta não pode travar o "Adicionar à biblioteca"
    const fetchWithTimeout = async (url, options = {}, ms = 4000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
    };

    // Retorna { text, translated } — "translated" diz se a tradução deu certo aqui no navegador
    const translateSynopsisToPt = async (text) => {
        const empty = { text: 'Sem sinopse disponível.', translated: true };
        if (!text || !text.trim()) return empty;
        const clean = text.replace(/<[^>]+>/g, '').replace(/\(Source:[^)]+\)/gi, '').trim();
        if (!clean) return empty;

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(clean)}`;
            const res = await fetchWithTimeout(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && Array.isArray(data[0])) {
                    const translated = data[0].map((part) => part[0] || '').join('');
                    if (translated.trim()) return { text: translated.trim(), translated: true };
                }
            }
        } catch (err) {
            console.warn('Falha ao traduzir no cliente, o servidor tentará traduzir:', err);
        }
        return { text: clean, translated: false };
    };

    const fetchChaptersFromJikanOrMangaDex = async (title) => {
        if (!title) return 0;
        // 1. Jikan (MyAnimeList)
        try {
            const res = await fetchWithTimeout(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=3`);
            if (res.ok) {
                const json = await res.json();
                const items = json?.data || [];
                for (const item of items) {
                    if (item.chapters && Number(item.chapters) > 0) {
                        return Number(item.chapters);
                    }
                }
            }
        } catch {
            // Continua para MangaDex
        }

        // 2. MangaDex
        try {
            const res = await fetchWithTimeout(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&order[relevance]=desc`);
            if (res.ok) {
                const json = await res.json();
                const manga = json?.data?.[0];
                if (manga?.id) {
                    const lastChap = Number(manga?.attributes?.lastChapter);
                    if (lastChap > 0) return lastChap;

                    const aggRes = await fetchWithTimeout(`https://api.mangadex.org/manga/${manga.id}/aggregate`);
                    if (aggRes.ok) {
                        const aggJson = await aggRes.json();
                        const volumes = aggJson?.volumes || {};
                        let maxChap = 0;
                        Object.values(volumes).forEach((vol) => {
                            Object.keys(vol?.chapters || {}).forEach((chKey) => {
                                const num = Math.floor(Number(chKey));
                                if (!Number.isNaN(num) && num > maxChap) {
                                    maxChap = num;
                                }
                            });
                        });
                        if (maxChap > 0) return maxChap;
                    }
                }
            }
        } catch {
            // Ignora erro
        }

        return 0;
    };

    // ---------------- BUSCA ANILIST E LIMPEZA ----------------
    const handleSearchAniList = async (valor, adult = showAdult) => {
        const busca = valor.trim();
        if (!busca) { setSearchResults([]); return; }

        const query = `
            query ($search: String, $isAdult: Boolean, $genreNotIn: [String]) {
                Page(page: 1, perPage: 4) {
                    media(search: $search, type: MANGA, isAdult: $isAdult, genre_not_in: $genreNotIn) {
                        id title { romaji english } coverImage { extraLarge } description(asHtml: false) format status isAdult genres chapters
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
            setSearchResults(result?.data?.Page?.media || []);
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
            const created = await createWork(dados);
            // Insere a obra nova direto na lista, sem recarregar a biblioteca inteira
            // (recarregar também disparava a sincronização de TODAS as obras em segundo plano)
            if (created && created.id) {
                setAllWorks((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
            } else {
                await fetchMyNovels();
            }
            clearSearch();
            return true;
        } catch (error) {
            alert(error.message || 'Erro ao salvar no banco.');
            return false;
        }
    };

    const handleSaveFromApi = async (novel) => {
        if (savingWorkKey !== null) return;
        if (isNovelInLibrary(novel)) {
            alert('Esta obra já está na sua biblioteca!');
            return;
        }

        setSavingWorkKey(novel.id);
        try {
            const rawDesc = novel.description ? novel.description.replace(/<[^>]+>/g, '') : '';
            const knownChapters = Number(novel.chapters) || 0;

            // Tradução e busca de capítulos rodam AO MESMO TEMPO (antes era uma depois da outra)
            const [synopsis, totalChapters] = await Promise.all([
                translateSynopsisToPt(rawDesc),
                knownChapters > 0
                    ? Promise.resolve(knownChapters)
                    : fetchChaptersFromJikanOrMangaDex(novel.title?.english || novel.title?.romaji),
            ]);

            await enviarParaLaravel({
                title: novel.title.romaji,
                cover_image: novel.coverImage.extraLarge,
                description: synopsis.text,
                type: novel.format || 'MANGA',
                status: novel.status || 'RELEASING',
                is_adult: novel.isAdult || false,
                genres: novel.genres || [],
                total_chapters: totalChapters,
                // Avisa o servidor que o trabalho pesado já foi feito aqui, para ele não repetir
                already_translated: synopsis.translated,
                chapters_checked: true,
            });
        } finally {
            setSavingWorkKey(null);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setManualTitle('');
        setManualCover('');
        setManualDesc('');
        setManualSourceUrl('');
        setManualChapters('');
        setManualType('manga');
        setManualStatus('ongoing');
        setManualGenres([]);
    };

    const openCreate = () => { resetForm(); setShowForm(true); };
    
    const openEdit = (work) => {
        setEditingId(work.id);
        setManualTitle(work.title || '');
        setManualCover(work.cover_url || '');
        setManualDesc(work.synopsis || '');
        setManualSourceUrl(work.source_url || '');
        setManualChapters(work.total_chapters ? String(work.total_chapters) : '');
        setManualType((work.type || 'manga').toLowerCase());
        setManualStatus((work.status || 'ongoing').toLowerCase());
        setManualGenres(parseGenres(work.genres));
        setShowForm(true);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (savingWorkKey !== null) return;

        if (!editingId) {
            const target = normalizeTitle(manualTitle);
            if (allWorks.some((w) => normalizeTitle(w.title) === target)) {
                alert('Esta obra já está na sua biblioteca!');
                return;
            }
        }

        const dados = { 
            title: manualTitle, 
            cover_image: manualCover, 
            description: manualDesc,
            source_url: manualSourceUrl,
            total_chapters: Number(manualChapters) || 0,
            type: manualType,
            status: manualStatus,
            genres: manualGenres,
        };
        
        setSavingWorkKey('manual');
        try {
            if (editingId) {
                try { await updateWork(editingId, dados); await fetchMyNovels(); } catch (error) { alert('Erro ao atualizar.'); return; }
            } else {
                const ok = await enviarParaLaravel(dados);
                if (!ok) return;
            }
            resetForm();
        } finally {
            setSavingWorkKey(null);
        }
    };

    const confirmDelete = async () => {
        if (!workToDelete) return;
        const targetId = workToDelete.id;
        try {
            await deleteWork(targetId);
            setWorkToDelete(null);
            // Remove instantaneamente da lista da biblioteca local
            setAllWorks((prev) => prev.filter((w) => w.id !== targetId));
        } catch (error) {
            alert(error.message || 'Erro ao remover da sua biblioteca.');
        }
    };

    if (viewingChaptersWork) {
        return (
            <TelaCapitulos 
                work={viewingChaptersWork} 
                onBack={() => {
                    setViewingChaptersWork(null);
                    fetchMyNovels();
                }}
                onWorkUpdated={(updatedWork) => {
                    setViewingChaptersWork(updatedWork);
                    setAllWorks((prev) => prev.map((w) => (w.id === updatedWork.id ? updatedWork : w)));
                }}
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
                            <option value="MANGA">Mangá</option>
                        </select>

                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="todos">Qualquer Estado</option>
                            <option value="RELEASING">Em Lançamento</option>
                            <option value="FINISHED">Concluído</option>
                        </select>

                        <button className={`chip ${libraryShowAdult ? 'active' : ''}`} onClick={() => setLibraryShowAdult(!libraryShowAdult)}>
                            🔞 {libraryShowAdult ? 'Mostrando +18' : '+18 Oculto'}
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
                                {translateGenre(g)}
                            </button>
                        ))}
                    </div>

                    {/* RECOMENDAÇÃO ALEATÓRIA (catálogo inteiro do AniList) */}
                    <WorkRecommendation
                        selectedGenres={selectedGenres}
                        isInLibrary={isNovelInLibrary}
                        onAdd={handleSaveFromApi}
                        savingWorkKey={savingWorkKey}
                        translateGenre={translateGenre}
                        translateFormat={translateFormat}
                        translateStatus={translateStatus}
                    />
                </div>

                {/* RESULTADOS DA API (AniList) */}
                {searchResults.length > 0 && (
                    <div style={{ marginBottom: '50px', padding: '24px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid #6366f1', borderRadius: '20px' }}>
                        <h2 style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icons.Search /> Resultados da internet
                        </h2>
                        <div className="carousel">
                            {searchResults.map((novel) => {
                                const alreadyAdded = isNovelInLibrary(novel);
                                const isSavingThis = savingWorkKey === novel.id;

                                return (
                                    <article key={novel.id} className="loredex-card carousel-item">
                                        <div className="cover">
                                            <img src={novel.coverImage.extraLarge} alt={`Capa de ${novel.title.romaji}`} />
                                            <div className="badges">
                                                <span className="badge type">{translateFormat(novel.format || 'Manga')}</span>
                                                {novel.status && <span className="badge status">{translateStatus(novel.status)}</span>}
                                            </div>
                                        </div>
                                        <div className="card-content">
                                            <h4>{novel.title.romaji}</h4>
                                            {Array.isArray(novel.genres) && novel.genres.length > 0 && (
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                    {novel.genres.slice(0, 3).map((g) => (
                                                        <span
                                                            key={g}
                                                            style={{
                                                                fontSize: '10px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(99, 102, 241, 0.2)',
                                                                color: '#a5b4fc',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {translateGenre(g)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                className="btn-save"
                                                disabled={alreadyAdded || savingWorkKey !== null}
                                                style={
                                                    alreadyAdded
                                                        ? { background: '#334155', color: '#94a3b8', cursor: 'not-allowed' }
                                                        : isSavingThis
                                                        ? { opacity: 0.7, cursor: 'wait' }
                                                        : undefined
                                                }
                                                onClick={() => handleSaveFromApi(novel)}
                                            >
                                                {alreadyAdded
                                                    ? '✓ Já na biblioteca'
                                                    : isSavingThis
                                                    ? 'Adicionando...'
                                                    : '+ Adicionar'}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
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

                {/* 1. MODAL: PÁGINA DE DETALHES DA OBRA */}
                {workDetails && (
                    <div className="modal-bg" onClick={() => setWorkDetails(null)}>
                        <div className="modal details-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setWorkDetails(null)} style={{ background: 'rgba(15,23,42,0.8)', padding: '6px', borderRadius: '50%', zIndex: 10 }}>✕</button>
                            
                            <div className="details-cover-container">
                                <img src={workDetails.cover_url || PLACEHOLDER} alt="Capa da Obra" />
                            </div>
                            
                            <div className="details-info">
                                <h2>{workDetails.title}</h2>
                                
                                <div className="badges-row" style={{ flexWrap: 'wrap' }}>
                                    {workDetails.type && <span className="badge type">{translateFormat(workDetails.type)}</span>}
                                    {workDetails.status && <span className="badge status">{translateStatus(workDetails.status)}</span>}
                                    {Number(workDetails.total_chapters) > 0 && (
                                        <span className="badge status">{workDetails.total_chapters} capítulos</span>
                                    )}
                                </div>

                                {parseGenres(workDetails.genres).length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        {parseGenres(workDetails.genres).map((g) => (
                                            <span
                                                key={g}
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    background: 'rgba(99, 102, 241, 0.18)',
                                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                                    color: '#c7d2fe',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {translateGenre(g)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
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
                        <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                            <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar obra' : 'Cadastro Manual'}</h2>
                            <form onSubmit={handleSubmitForm}>
                                <div>
                                    <label style={{ color: '#94a3b8' }}>Título da Obra</label>
                                    <input type="text" required className="form-input" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '13px' }}>Formato</label>
                                        <select className="form-input" value={manualType} onChange={(e) => setManualType(e.target.value)}>
                                            <option value="manga">Mangá</option>
                                            <option value="novel">Novel</option>
                                            <option value="webnovel">Webnovel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '13px' }}>Estado</label>
                                        <select className="form-input" value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}>
                                            <option value="ongoing">Em Lançamento</option>
                                            <option value="completed">Concluído</option>
                                            <option value="dropped">Cancelado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '13px' }}>Total de Capítulos</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-input"
                                            value={manualChapters}
                                            onChange={(e) => setManualChapters(e.target.value)}
                                            placeholder="Ex: 200"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Gêneros</label>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {availableGenres.map((g) => (
                                            <button
                                                type="button"
                                                key={g}
                                                className={`chip ${manualGenres.includes(g) ? 'active' : ''}`}
                                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                                onClick={() => {
                                                    setManualGenres((prev) =>
                                                        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                                                    );
                                                }}
                                            >
                                                {translateGenre(g)}
                                            </button>
                                        ))}
                                    </div>
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
                            <h2 style={{ marginTop: 0 }}>Remover da biblioteca?</h2>
                            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                                "{workToDelete.title}" será removida apenas da sua biblioteca pessoal. Você poderá adicioná-la novamente quando quiser.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button className="btn-secondary" onClick={() => setWorkToDelete(null)}>Cancelar</button>
                                <button className="btn-danger" onClick={confirmDelete}>Remover</button>
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
