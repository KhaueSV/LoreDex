import React, { useRef, useState } from 'react';
import '../../css/home.css';

// Quantas páginas (de 50 obras cada) do AniList entram no sorteio.
// 100 páginas = as ~5000 obras mais populares, evitando sugestões obscuras/vazias.
const ANILIST_URL = 'https://graphql.anilist.co';
const PER_PAGE = 50;
const MAX_PAGES = 100;

const RANDOM_QUERY = `
    query ($page: Int, $perPage: Int, $isAdult: Boolean, $genreIn: [String], $genreNotIn: [String]) {
        Page(page: $page, perPage: $perPage) {
            pageInfo { lastPage }
            media(type: MANGA, sort: POPULARITY_DESC, isAdult: $isAdult, genre_in: $genreIn, genre_not_in: $genreNotIn) {
                id
                siteUrl
                title { romaji english }
                coverImage { extraLarge large }
                description(asHtml: false)
                format
                status
                isAdult
                genres
                chapters
                averageScore
            }
        }
    }
`;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const stripHtml = (text) => String(text || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();

/**
 * Recomenda uma obra ALEATÓRIA de todo o catálogo do AniList
 * (a mesma API usada na busca "Adicionar nova obra"), e não da biblioteca do usuário.
 * Os gêneros selecionados no filtro são opcionais e só são usados se o usuário quiser.
 */
export default function WorkRecommendation({
    selectedGenres = [],
    isInLibrary = () => false,
    onAdd,
    savingWorkKey = null,
    translateFormat,
    translateStatus,
    translateGenre = (g) => g,
}) {
    const [excludeAdult, setExcludeAdult] = useState(true);
    const [useGenres, setUseGenres] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Guarda o total de páginas já descoberto para cada combinação de filtros
    const lastPageCache = useRef({});

    const genresActive = useGenres && selectedGenres.length > 0;

    const fetchPage = async (page, variables) => {
        const response = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ query: RANDOM_QUERY, variables: { ...variables, page, perPage: PER_PAGE } }),
        });

        if (response.status === 429) {
            throw new Error('Muitas requisições ao AniList. Aguarde alguns segundos e tente de novo.');
        }
        if (!response.ok) {
            throw new Error('Não foi possível falar com o AniList agora.');
        }

        const result = await response.json();
        return result?.data?.Page || { media: [], pageInfo: { lastPage: 1 } };
    };

    const handleRecommend = async () => {
        setLoading(true);
        setError('');

        const variables = {
            isAdult: excludeAdult ? false : undefined,
            genreNotIn: excludeAdult ? ['Hentai', 'Ecchi'] : undefined,
            genreIn: genresActive ? selectedGenres : undefined,
        };
        const cacheKey = JSON.stringify(variables);

        try {
            const knownLastPage = lastPageCache.current[cacheKey];
            const maxPage = Math.min(knownLastPage || MAX_PAGES, MAX_PAGES);

            let data = await fetchPage(randomInt(1, maxPage), variables);
            const lastPage = Math.max(1, Number(data?.pageInfo?.lastPage) || 1);
            lastPageCache.current[cacheKey] = lastPage;

            // Página sorteada ficou além do fim (filtro muito restrito): sorteia de novo dentro do limite real
            if (!data.media?.length && lastPage >= 1) {
                data = await fetchPage(randomInt(1, Math.min(lastPage, MAX_PAGES)), variables);
            }

            const media = data.media || [];
            // Prefere obras que você ainda NÃO tem e que não sejam a sugestão atual
            const fresh = media.filter((m) => m.id !== recommendation?.id && !isInLibrary(m));
            const pool = fresh.length ? fresh : media.filter((m) => m.id !== recommendation?.id);

            if (!pool.length) {
                setRecommendation(null);
                setError('Nenhuma obra encontrada com esses filtros. Tente desmarcar os gêneros.');
                return;
            }

            setRecommendation(pool[randomInt(0, pool.length - 1)]);
        } catch (err) {
            setError(err.message || 'Erro ao buscar recomendação.');
        } finally {
            setLoading(false);
        }
    };

    const reco = recommendation;
    const alreadyAdded = reco ? isInLibrary(reco) : false;
    const isSaving = reco && savingWorkKey === reco.id;
    const synopsis = reco ? stripHtml(reco.description) : '';

    return (
        <section className="reco-panel" aria-label="Recomendação aleatória">
            <div className="reco-header">
                <div className="reco-intro">
                    <span className="reco-icon" aria-hidden="true">🎲</span>
                    <div>
                        <strong>Sem ideia do que ler?</strong>
                        <span>Sorteamos uma obra aleatória de todo o catálogo do AniList.</span>
                    </div>
                </div>

                <div className="reco-controls">
                    <button
                        type="button"
                        className={`chip ${excludeAdult ? 'active' : ''}`}
                        onClick={() => setExcludeAdult((v) => !v)}
                        title="Alterna a inclusão de obras adultas no sorteio"
                    >
                        🔞 {excludeAdult ? 'Sem +18' : 'Incluindo +18'}
                    </button>

                    {selectedGenres.length > 0 && (
                        <button
                            type="button"
                            className={`chip ${useGenres ? 'active' : ''}`}
                            onClick={() => setUseGenres((v) => !v)}
                            title="Usar os gêneros marcados abaixo como filtro do sorteio"
                        >
                            🏷 {useGenres ? `Só gêneros marcados (${selectedGenres.length})` : 'Qualquer gênero'}
                        </button>
                    )}

                    <button
                        type="button"
                        className="reco-btn"
                        onClick={handleRecommend}
                        disabled={loading}
                    >
                        {loading ? 'Sorteando...' : reco ? 'Sortear outra' : 'Recomendar uma obra'}
                    </button>
                </div>
            </div>

            {error && <p className="reco-error">{error}</p>}

            {reco && (
                <article className="reco-result">
                    <button
                        type="button"
                        className="reco-close"
                        onClick={() => setRecommendation(null)}
                        title="Fechar recomendação"
                        aria-label="Fechar recomendação"
                    >
                        ✕
                    </button>

                    <img
                        className="reco-cover"
                        src={reco.coverImage?.extraLarge || reco.coverImage?.large}
                        alt={`Capa de ${reco.title?.romaji}`}
                    />

                    <div className="reco-info">
                        <h4>{reco.title?.romaji || reco.title?.english}</h4>
                        {reco.title?.english && reco.title.english !== reco.title.romaji && (
                            <span className="reco-subtitle">{reco.title.english}</span>
                        )}

                        <div className="reco-meta">
                            {reco.format && <span className="badge type">{translateFormat(reco.format)}</span>}
                            {reco.status && <span className="badge status">{translateStatus(reco.status)}</span>}
                            {reco.averageScore && <span className="badge status">⭐ {reco.averageScore}%</span>}
                            {reco.chapters && <span className="badge status">{reco.chapters} caps</span>}
                        </div>

                        {Array.isArray(reco.genres) && reco.genres.length > 0 && (
                            <div className="reco-genres">
                                {reco.genres.slice(0, 5).map((g) => (
                                    <span key={g}>{translateGenre(g)}</span>
                                ))}
                            </div>
                        )}

                        <p className="reco-synopsis">{synopsis || 'Sem sinopse disponível.'}</p>

                        <div className="reco-actions">
                            <button
                                type="button"
                                className="btn-save"
                                onClick={() => onAdd && onAdd(reco)}
                                disabled={alreadyAdded || isSaving || savingWorkKey !== null}
                            >
                                {alreadyAdded ? '✓ Já está na biblioteca' : isSaving ? 'Salvando...' : '+ Adicionar à biblioteca'}
                            </button>
                            {reco.siteUrl && (
                                <a className="btn-secondary reco-link" href={reco.siteUrl} target="_blank" rel="noopener noreferrer">
                                    Ver no AniList ↗
                                </a>
                            )}
                        </div>
                    </div>
                </article>
            )}
        </section>
    );
}
