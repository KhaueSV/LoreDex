import React, { useEffect, useState } from 'react';
import '../../css/capitulos.css';

const VERDICTS = [
    { key: 'Lixo', icon: '🗑️' },
    { key: 'Ruim', icon: '👎' },
    { key: 'Bom', icon: '👍' },
    { key: 'Foda', icon: '🔥' },
];

const CRITERIA = [
    { key: 'arte', label: 'Arte', icon: '🎨' },
    { key: 'personagem', label: 'Personagens', icon: '🧑' },
    { key: 'traducao', label: 'Tradução', icon: '🌐' },
    { key: 'historia', label: 'História', icon: '📖' },
    { key: 'enredo', label: 'Enredo', icon: '🧩' },
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

export default function TelaCapitulos({ work, onBack }) {
    const progressKey = `loredex_progress_work_${work?.id}`;
    const evaluationKey = `loredex_eval_work_${work?.id}`;

    const totalChapters = Number(work?.total_chapters) || 0;

    const [chaptersRead, setChaptersRead] = useState(() => {
        const saved = localStorage.getItem(progressKey);

        if (saved !== null) {
            return Number(saved) || 0;
        }

        return Number(work?.chapters_read) || 0;
    });

    const [evaluation, setEvaluation] = useState(() => {
        try {
            const saved = localStorage.getItem(evaluationKey);

            return saved
                ? JSON.parse(saved)
                : EMPTY_EVAL;
        } catch {
            return EMPTY_EVAL;
        }
    });

    const [message, setMessage] = useState('');

    const progress = totalChapters > 0
        ? Math.min(
            100,
            Math.max(
                0,
                (chaptersRead / totalChapters) * 100
            )
        )
        : 0;

    /* Salva o progresso */
    useEffect(() => {
        localStorage.setItem(
            progressKey,
            String(chaptersRead)
        );
    }, [chaptersRead, progressKey]);

    /* Calcula a média dos critérios */
    useEffect(() => {
        const notas = [
            evaluation.arte,
            evaluation.personagem,
            evaluation.traducao,
            evaluation.historia,
            evaluation.enredo,
        ].filter((nota) => Number(nota) > 0);

        if (notas.length === 0) {
            return;
        }

        const media =
            notas.reduce(
                (total, nota) => total + Number(nota),
                0
            ) / notas.length;

        setEvaluation((prev) => ({
            ...prev,
            nota_geral: Number(media.toFixed(1)),
        }));
    }, [
        evaluation.arte,
        evaluation.personagem,
        evaluation.traducao,
        evaluation.historia,
        evaluation.enredo,
    ]);

    const changeProgress = (value) => {
        let novoValor = Number(value) || 0;

        if (novoValor < 0) {
            novoValor = 0;
        }

        if (totalChapters > 0) {
            novoValor = Math.min(
                novoValor,
                totalChapters
            );
        }

        setChaptersRead(novoValor);
    };

    const addProgress = (amount) => {
        changeProgress(chaptersRead + amount);
    };

    const updateEvaluation = (key, value) => {
        setEvaluation({
            ...evaluation,
            [key]: value,
        });
    };

    const saveProgress = () => {
        localStorage.setItem(
            progressKey,
            String(chaptersRead)
        );

        setMessage('Progresso salvo!');

        setTimeout(() => {
            setMessage('');
        }, 2000);
    };

    const saveEvaluation = () => {
        localStorage.setItem(
            evaluationKey,
            JSON.stringify(evaluation)
        );

        localStorage.setItem(
            progressKey,
            String(chaptersRead)
        );

        setMessage('Avaliação salva!');

        setTimeout(() => {
            setMessage('');
        }, 2000);
    };

    return (
        <div className="chapters-page">

            {/* CABEÇALHO */}

            <div className="chapters-header">

                <button
                    className="chapters-back"
                    onClick={onBack}
                >
                    ← Voltar
                </button>

                <div className="chapters-work">

                    <img
                        src={
                            work?.cover_url ||
                            'https://via.placeholder.com/100'
                        }
                        alt={work?.title || 'Obra'}
                    />

                    <div className="chapters-work-info">

                        <span className="chapters-label">
                            LoreDex
                        </span>

                        <h1>
                            {work?.title || 'Obra'}
                        </h1>

                        <p>
                            {work?.type &&
                                `${work.type} • `}
                            {work?.status ||
                                'Status não informado'}
                        </p>

                        <div className="chapters-stats">

                            <div className="stat">
                                <strong>
                                    {totalChapters > 0
                                        ? totalChapters
                                        : '—'}
                                </strong>

                                <span>
                                    Capítulos
                                </span>
                            </div>

                            <div className="stat">
                                <strong>
                                    {chaptersRead}
                                </strong>

                                <span>
                                    Lidos
                                </span>
                            </div>

                            <div className="stat">
                                <strong>
                                    {progress.toFixed(0)}%
                                </strong>

                                <span>
                                    Progresso
                                </span>
                            </div>

                            <div className="stat">
                                <strong>
                                    {evaluation.nota_geral > 0
                                        ? evaluation.nota_geral
                                        : '—'}
                                </strong>

                                <span>
                                    Nota
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* CONTEÚDO */}

            <div className="chapters-content">


                {/* PROGRESSO */}

                <section className="eval-card">

                    <div className="eval-card-header">

                        <div>

                            <h2>
                                Progresso da leitura
                            </h2>

                            
                        </div>

                        <strong className="progress-percentage">
                            {progress.toFixed(0)}%
                        </strong>

                    </div>


                    <div className="reading-progress">

                        <div
                            className="reading-progress-bar"
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>


                    

                    <div className="progress-controls">

                        <div className="progress-input-wrapper">

                            <label>
                                Capítulo atual
                            </label>

                            <input
                                type="number"
                                min="0"
                                max={
                                    totalChapters > 0
                                        ? totalChapters
                                        : undefined
                                }
                                value={chaptersRead}
                                onChange={(e) =>
                                    changeProgress(
                                        e.target.value
                                    )
                                }
                                className="form-input"
                            />

                            <div className="progress-quick-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() =>
                                        addProgress(1)
                                    }
                                >
                                    +1
                                </button>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() =>
                                        addProgress(3)
                                    }
                                >
                                    +3
                                </button>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() =>
                                        addProgress(5)
                                    }
                                >
                                    +5
                                </button>

                            </div>

                        </div>


                        <button
                            className="btn-primary progress-save"
                            onClick={saveProgress}
                        >
                            Salvar progresso
                        </button>

                    </div>

                </section>


                {/* AVALIAÇÃO */}

                <section className="eval-card">

                    <div className="eval-card-header">

                        <div>

                            <h2>
                                Avaliação da obra
                            </h2>

                        </div>

                        <div className="big-score">
                            {evaluation.nota_geral > 0
                                ? evaluation.nota_geral
                                : '—'}

                            <small>
                                /10
                            </small>
                        </div>

                    </div>


                    {/* VEREDITO */}

                    <div className="eval-section">

                        <label className="section-title">
                            Veredito
                        </label>

                        <div className="chips-container">

                            {VERDICTS.map(
                                ({ key, icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`chip ${
                                            evaluation.indicador === key
                                                ? 'active'
                                                : ''
                                        }`}
                                        onClick={() =>
                                            updateEvaluation(
                                                'indicador',
                                                evaluation.indicador === key
                                                    ? ''
                                                    : key
                                            )
                                        }
                                    >

                                        <span className="chip-icon">
                                            {icon}
                                        </span>

                                        {key}

                                    </button>
                                )
                            )}

                        </div>

                    </div>


                    <hr className="eval-divider" />


                    {/* CRITÉRIOS */}

                    <div className="eval-section criteria-section">

                        <label className="section-title">
                            Critérios da obra

                            <span>
                                A nota geral é a média.
                            </span>
                        </label>


                        {CRITERIA.map(
                            ({
                                key,
                                label,
                                icon,
                            }) => (
                                <div
                                    key={key}
                                    className="criteria-row"
                                >

                                    <span className="criteria-name">

                                        <span className="criteria-icon">
                                            {icon}
                                        </span>

                                        {label}

                                    </span>


                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={
                                            evaluation[key]
                                        }
                                        onChange={(e) =>
                                            updateEvaluation(
                                                key,
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                    />


                                    <span className="criteria-score">

                                        {evaluation[key] > 0
                                            ? evaluation[key]
                                            : '—'}

                                    </span>

                                </div>
                            )
                        )}

                    </div>


                    {/* NOTA */}

                    <div className="main-score">

                        <div className="main-score-heading">

                            <span>
                                Nota geral
                            </span>

                            <strong>
                                {evaluation.nota_geral > 0
                                    ? evaluation.nota_geral
                                    : '—'}
                            </strong>

                        </div>

                        <div className="score-progress">

                            <div
                                style={{
                                    width: `${
                                        evaluation.nota_geral * 10
                                    }%`,
                                }}
                            />

                        </div>

                    </div>


                    {/* COMENTÁRIO */}

                    <div className="eval-section">

                        <label className="section-title">
                            Comentário
                        </label>

                        <textarea
                            className="form-input"
                            rows="4"
                            placeholder="O que você achou da obra?"
                            value={
                                evaluation.comentario
                            }
                            onChange={(e) =>
                                updateEvaluation(
                                    'comentario',
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <button
                        className="btn-primary btn-save-eval"
                        onClick={saveEvaluation}
                    >
                        Salvar avaliação
                    </button>

                </section>


                {message && (
                    <div className="save-message">
                        ✓ {message}
                    </div>
                )}

            </div>

        </div>
    );
}