import React, { useEffect, useState } from 'react';
import '../../css/capitulos.css';
import { getWorkReviews, createWorkReview, deleteWorkReview } from '../services/api';

// Ícones SVG vetoriais nítidos (dispensam pacotes externos)
const Icons = {
    ArrowLeft: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
    ),
    BookOpen: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
    ),
    Star: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    ),
    Check: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ld-toast-icon">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ),
    Save: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
    ),
    Trash: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    ),
    ThumbsDown: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>
    ),
    ThumbsUp: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
    ),
    Flame: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"></path>
        </svg>
    ),
    Palette: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
        </svg>
    ),
    Users: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    ),
    Globe: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
    ),
    BookText: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <line x1="8" y1="7" x2="16" y2="7"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
    ),
    Puzzle: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.439 7.85c0-1.57.802-2.54 2.161-2.54 1.36 0 2.4 1.25 2.4 2.54 0 1.3-.96 2.35-2.4 2.35v3.6h-3.6c0-1.44-1.05-2.4-2.35-2.4-1.29 0-2.54 1.04-2.54 2.4 0 1.35.97 2.16 2.54 2.16v3.6H4.2c-1.2 0-2.2-1-2.2-2.2V4.2C2 3 3 2 4.2 2h11.45v3.6c-1.57 0-2.54.81-2.54 2.16 0 1.36 1.25 2.4 2.54 2.4 1.3 0 2.35-.96 2.35-2.4h3.6v.09h-.16z"></path>
        </svg>
    ),
    MessageSquare: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    ),
    Send: () => (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    ),
};

const VERDICTS = [
    { key: 'lixo', label: 'Lixo', icon: Icons.Trash, activeClass: 'active-lixo' },
    { key: 'ruim', label: 'Ruim', icon: Icons.ThumbsDown, activeClass: 'active-ruim' },
    { key: 'bom', label: 'Bom', icon: Icons.ThumbsUp, activeClass: 'active-bom' },
    { key: 'foda', label: 'Foda', icon: Icons.Flame, activeClass: 'active-foda' },
];

const CRITERIA = [
    { key: 'arte', label: 'Arte', icon: Icons.Palette },
    { key: 'personagem', label: 'Personagens', icon: Icons.Users },
    { key: 'traducao', label: 'Tradução', icon: Icons.Globe },
    { key: 'historia', label: 'História', icon: Icons.BookText },
    { key: 'enredo', label: 'Enredo', icon: Icons.Puzzle },
];

const EMPTY_EVAL = {
    nota_geral: 0,
    arte: 0,
    personagem: 0,
    traducao: 0,
    historia: 0,
    enredo: 0,
    comentario: '',
    indicador: '',
};

function getScoreTierClass(score) {
    if (!score || score === 0) return 'score-tier-none';
    if (score >= 8.5) return 'score-tier-high';
    if (score >= 6.0) return 'score-tier-mid';
    return 'score-tier-low';
}

export default function TelaCapitulos({ work, onBack }) {
    const progressKey = `loredex_progress_work_${work?.id}`;
    const evaluationKey = `loredex_eval_work_${work?.id}`;

    const totalChapters = Number(work?.total_chapters) || 0;

    const [chaptersRead, setChaptersRead] = useState(() => {
        const saved = localStorage.getItem(progressKey);
        if (saved !== null) return Number(saved) || 0;
        return Number(work?.chapters_read) || 0;
    });

    const [evaluation, setEvaluation] = useState(() => {
        try {
            const saved = localStorage.getItem(evaluationKey);
            return saved ? JSON.parse(saved) : EMPTY_EVAL;
        } catch {
            return EMPTY_EVAL;
        }
    });

    const [message, setMessage] = useState('');

    // Estados para o Feed de Comentários Gerais
    const [reviews, setReviews] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingReviews, setLoadingReviews] = useState(false);

    const progress = totalChapters > 0
        ? Math.min(100, Math.max(0, (chaptersRead / totalChapters) * 100))
        : 0;

    // Buscar comentários do servidor ao abrir a obra
    useEffect(() => {
        if (work?.id) {
            setLoadingReviews(true);
            getWorkReviews(work.id)
                .then((data) => setReviews(data))
                .catch((err) => console.error('Erro ao carregar comentários:', err))
                .finally(() => setLoadingReviews(false));
        }
    }, [work?.id]);

    // Auto-salva o progresso sempre que muda
    useEffect(() => {
        localStorage.setItem(progressKey, String(chaptersRead));
    }, [chaptersRead, progressKey]);

    // Recalcula média dos critérios
    useEffect(() => {
        const notas = [
            evaluation.arte,
            evaluation.personagem,
            evaluation.traducao,
            evaluation.historia,
            evaluation.enredo,
        ].filter((nota) => Number(nota) > 0);

        if (notas.length === 0) {
            if (evaluation.nota_geral !== 0) {
                setEvaluation((prev) => ({ ...prev, nota_geral: 0 }));
            }
            return;
        }

        const media = notas.reduce((total, nota) => total + Number(nota), 0) / notas.length;
        const rounded = Number(media.toFixed(1));

        if (evaluation.nota_geral !== rounded) {
            setEvaluation((prev) => ({
                ...prev,
                nota_geral: rounded,
            }));
        }
    }, [
        evaluation.arte,
        evaluation.personagem,
        evaluation.traducao,
        evaluation.historia,
        evaluation.enredo,
    ]);

    const changeProgress = (value) => {
        let novoValor = Number(value) || 0;
        if (novoValor < 0) novoValor = 0;
        if (totalChapters > 0) {
            novoValor = Math.min(novoValor, totalChapters);
        }
        setChaptersRead(novoValor);
    };

    const addProgress = (amount) => {
        changeProgress(chaptersRead + amount);
    };

    const updateEvaluation = (key, value) => {
        setEvaluation((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const showToast = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 2200);
    };

    const saveProgress = () => {
        localStorage.setItem(progressKey, String(chaptersRead));
        showToast('Progresso atualizado!');
    };

    const saveEvaluation = () => {
        localStorage.setItem(evaluationKey, JSON.stringify(evaluation));
        localStorage.setItem(progressKey, String(chaptersRead));
        showToast('Avaliação e progresso salvos com sucesso!');
    };

    // Função para publicar um comentário geral no feed
    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const created = await createWorkReview(work.id, {
                comment: newComment,
                verdict: evaluation.indicador || null,
                score: evaluation.nota_geral > 0 ? evaluation.nota_geral : null,
                criteria: {
                    arte: evaluation.arte,
                    personagem: evaluation.personagem,
                    traducao: evaluation.traducao,
                    historia: evaluation.historia,
                    enredo: evaluation.enredo,
                }
            });

            setReviews([created, ...reviews]);
            setNewComment('');
            showToast('Comentário publicado com sucesso!');
        } catch (error) {
            alert(error.message || 'Erro ao publicar comentário.');
        }
    };

    // Função para excluir um comentário
    const handleDeleteComment = async (reviewId) => {
        if (!window.confirm('Deseja realmente excluir este comentário?')) return;
        try {
            await deleteWorkReview(work.id, reviewId);
            setReviews(reviews.filter((r) => r.id !== reviewId));
            showToast('Comentário removido.');
        } catch (error) {
            alert('Erro ao excluir comentário.');
        }
    };

    const remainingChapters = totalChapters > chaptersRead ? totalChapters - chaptersRead : 0;

    return (
        <div className="chapters-page">
            {/* VOLTAR */}
            <button className="chapters-back" onClick={onBack}>
                <Icons.ArrowLeft />
                <span>Voltar</span>
            </button>

            {/* HERO DA OBRA */}
            <div className="chapters-work-hero">
                <div className="work-cover-wrapper">
                    <img
                        className="work-cover-img"
                        src={work?.cover_url || 'https://via.placeholder.com/150x225?text=Capa'}
                        alt={work?.title || 'Obra'}
                    />
                </div>

                <div className="chapters-work-info">
                    <div>
                        <div className="work-meta-top">
                            <span className="badge-brand">
                                <span className="badge-brand-dot"></span>
                                LoreDex Tracker
                            </span>
                            {work?.type && <span className="badge-type">{work.type}</span>}
                        </div>

                        <div className="work-title-group">
                            <h1>{work?.title || 'Obra sem título'}</h1>
                            <div className="work-status">
                                <span className="work-status-indicator"></span>
                                <span>{work?.status || 'Status não informado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* ESTATÍSTICAS (4 CARDS) */}
                    <div className="chapters-stats">
                        <div className="stat-item">
                            <span className="stat-value">{totalChapters > 0 ? totalChapters : '—'}</span>
                            <span className="stat-label">Capítulos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{chaptersRead}</span>
                            <span className="stat-label">Lidos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{progress.toFixed(0)}%</span>
                            <span className="stat-label">Progresso</span>
                        </div>
                        <div className="stat-item">
                            <span className={`stat-value ${getScoreTierClass(evaluation.nota_geral)}`}>
                                {evaluation.nota_geral > 0 ? evaluation.nota_geral.toFixed(1) : '—'}
                            </span>
                            <span className="stat-label">Nota</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="chapters-content">
                {/* CARD DE PROGRESSO */}
                <section className="content-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <div className="card-icon-pill">
                                <Icons.BookOpen />
                            </div>
                            <div>
                                <h2>Progresso da Leitura</h2>
                            </div>
                        </div>

                        <div className="progress-header-metric">
                            <span className="progress-header-pct">{progress.toFixed(0)}%</span>
                            <span className="progress-header-label">concluído</span>
                        </div>
                    </div>

                    {/* BARRA DE PROGRESSO */}
                    <div className="progress-track-wrapper">
                        <div className="progress-track">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="progress-meta-text">
                            <span>
                                {chaptersRead} de {totalChapters > 0 ? totalChapters : '?'} capítulos
                            </span>
                            <span>
                                {totalChapters > 0
                                    ? remainingChapters === 0
                                        ? '✨ Obra completada!'
                                        : `${remainingChapters} capítulos restantes`
                                    : ''}
                            </span>
                        </div>
                    </div>

                    {/* CONTROLES */}
                    <div className="reading-controls">
                        <div className="chapter-input-container">
                            <span className="chapter-input-label">Capítulo atual:</span>
                            <div className="chapter-stepper">
                                <button
                                    type="button"
                                    className="step-btn"
                                    disabled={chaptersRead <= 0}
                                    onClick={() => addProgress(-1)}
                                    title="Capítulo anterior"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max={totalChapters > 0 ? totalChapters : undefined}
                                    value={chaptersRead}
                                    onChange={(e) => changeProgress(e.target.value)}
                                    className="chapter-number-input"
                                />
                                <button
                                    type="button"
                                    className="step-btn"
                                    disabled={totalChapters > 0 && chaptersRead >= totalChapters}
                                    onClick={() => addProgress(1)}
                                    title="Próximo capítulo"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="quick-add-group">
                            <button type="button" className="btn-chip" onClick={() => addProgress(1)}>
                                +1 cap
                            </button>
                            <button type="button" className="btn-chip" onClick={() => addProgress(5)}>
                                +5 caps
                            </button>
                            {totalChapters > 0 && chaptersRead < totalChapters && (
                                <button
                                    type="button"
                                    className="btn-chip"
                                    onClick={() => changeProgress(totalChapters)}
                                >
                                    Concluir
                                </button>
                            )}
                        </div>

                        <button type="button" className="btn-primary-action" onClick={saveProgress}>
                            <Icons.Save />
                            <span>Salvar progresso</span>
                        </button>
                    </div>
                </section>

                {/* CARD DE AVALIAÇÃO */}
                <section className="content-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <div className="card-icon-pill">
                                <Icons.Star />
                            </div>
                            <div>
                                <h2>Avaliação & Review</h2>
                            </div>
                        </div>

                        <div className="score-badge-main">
                            <span className={`score-number ${getScoreTierClass(evaluation.nota_geral)}`}>
                                {evaluation.nota_geral > 0 ? evaluation.nota_geral.toFixed(1) : '—'}
                            </span>
                            <span className="score-max">/10</span>
                        </div>
                    </div>

                    {/* VEREDITOS */}
                    <div className="verdict-grid">
                        {VERDICTS.map(({ key, label, icon: IconComponent, activeClass }) => {
                            const isActive = evaluation.indicador === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`verdict-card ${isActive ? activeClass : ''}`}
                                    onClick={() => updateEvaluation('indicador', isActive ? '' : key)}
                                >
                                    <IconComponent />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* CRITÉRIOS COM SLIDER DINÂMICO */}
                    <div className="section-subheading" style={{ marginTop: '24px' }}>
                        <span className="section-label">Critérios Avaliados</span>
                    </div>

                    <div className="criteria-list">
                        {CRITERIA.map(({ key, label, icon: IconComponent }) => {
                            const scoreValue = Number(evaluation[key]) || 0;
                            const fillPercent = (scoreValue / 10) * 100;

                            return (
                                <div key={key} className="criteria-row">
                                    <div className="criteria-label-col">
                                        <div className="criteria-icon-wrap">
                                            <IconComponent />
                                        </div>
                                        <span>{label}</span>
                                    </div>

                                    <div className="criteria-slider-col">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={scoreValue}
                                            style={{ '--slider-fill': `${fillPercent}%` }}
                                            onChange={(e) => updateEvaluation(key, Number(e.target.value))}
                                            className="criteria-slider"
                                        />
                                    </div>

                                    <span className={`criteria-score-badge ${scoreValue > 0 ? 'has-score' : ''}`}>
                                        {scoreValue > 0 ? scoreValue.toFixed(1) : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* COMENTÁRIO */}
                    <div className="section-subheading" style={{ marginTop: '22px' }}>
                        <span className="section-label">Anotações & Comentário pessoal</span>
                    </div>

                    <textarea
                        className="comment-input"
                        placeholder="O que achou do ritmo, personagens, arte e reviravoltas?"
                        value={evaluation.comentario}
                        onChange={(e) => updateEvaluation('comentario', e.target.value)}
                    />

                    {/* BOTÃO FINAL */}
                    <div className="eval-footer-row">
                        <button type="button" className="btn-primary-action btn-save-full" onClick={saveEvaluation}>
                            <Icons.Save />
                            <span>Salvar Avaliação Completa</span>
                        </button>
                    </div>
                </section>

                {/* NOVO CARD: FEED DE COMENTÁRIOS GERAIS DA COMUNIDADE */}
                <section className="content-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <div className="card-icon-pill">
                                <Icons.MessageSquare />
                            </div>
                            <div>
                                <h2>Comentários Gerais da Comunidade</h2>
                            </div>
                        </div>
                    </div>

                    {/* FORMULÁRIO DE NOVO COMENTÁRIO */}
                    <form onSubmit={handlePostComment} style={{ marginBottom: '24px' }}>
                        <textarea
                            className="comment-input"
                            placeholder="Escreva um comentário público sobre esta obra..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows="3"
                        />
                        <div className="eval-footer-row" style={{ marginTop: '10px' }}>
                            <button type="submit" className="btn-primary-action">
                                <Icons.Send />
                                <span>Publicar Comentário</span>
                            </button>
                        </div>
                    </form>

                    {/* LISTAGEM DOS COMENTÁRIOS */}
                    {loadingReviews ? (
                        <p style={{ color: 'var(--ld-text-muted)', textAlign: 'center', padding: '20px 0' }}>Carregando comentários...</p>
                    ) : reviews.length === 0 ? (
                        <p style={{ color: 'var(--ld-text-muted)', textAlign: 'center', padding: '20px 0' }}>Nenhum comentário publicado ainda. Seja o primeiro!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {reviews.map((rev) => (
                                <div 
                                    key={rev.id} 
                                    style={{ 
                                        background: 'var(--ld-bg-subtle)', 
                                        border: '1px solid var(--ld-border-subtle)', 
                                        borderRadius: 'var(--ld-radius-md)', 
                                        padding: '16px' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                                                {rev.user?.name || 'Usuário'}
                                            </span>
                                            {rev.verdict && (
                                                <span className="badge type" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                                    {rev.verdict}
                                                </span>
                                            )}
                                            {rev.score && (
                                                <span style={{ fontSize: '12px', color: 'var(--ld-primary-light)', fontWeight: '600' }}>
                                                    ★ {rev.score}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--ld-text-muted)' }}>
                                                {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteComment(rev.id)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px' }}
                                                title="Excluir comentário"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--ld-text-secondary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {rev.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* TOAST DE FEEDBACK */}
            {message && (
                <div className="ld-toast">
                    <Icons.Check />
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
}