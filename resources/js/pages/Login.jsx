import React, { useEffect, useState } from 'react';
import { login, register, getSavedEmail } from '../services/api';
import '../../css/login.css';

const SAVED_EMAIL_KEY = 'loredex_saved_email';
const REMEMBER_LOGIN_KEY = 'loredex_remember_login';

const BACKGROUNDS = [
    '/images/login/animes1.jpeg',
    '/images/login/animes2.jpeg',
    '/images/login/animes3.jpeg',
];

export default function Login({ onSuccess }) {
    const [isRegister, setIsRegister] = useState(false);

    const [name, setName] = useState('');

    const [email, setEmail] = useState(
        getSavedEmail() || localStorage.getItem(SAVED_EMAIL_KEY) || ''
    );

    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    const [rememberLogin, setRememberLogin] = useState(
        localStorage.getItem(REMEMBER_LOGIN_KEY) === 'true'
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Controle da imagem de fundo
    const [backgroundIndex, setBackgroundIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);

            setTimeout(() => {
                setBackgroundIndex((prev) =>
                    (prev + 1) % BACKGROUNDS.length
                );

                setIsTransitioning(false);
            }, 900);
        }, 7000);

        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Preencha o e-mail e a senha.');
            return;
        }

        if (isRegister && !name.trim()) {
            setError('Preencha seu nome.');
            return;
        }

        setLoading(true);

        try {
            if (isRegister) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }

            // Salva somente o e-mail.
            // A senha não é armazenada no localStorage.
            if (rememberLogin) {
                localStorage.setItem(SAVED_EMAIL_KEY, email);
                localStorage.setItem(REMEMBER_LOGIN_KEY, 'true');
            } else {
                localStorage.removeItem(SAVED_EMAIL_KEY);
                localStorage.removeItem(REMEMBER_LOGIN_KEY);
            }

            onSuccess();
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                (
                    isRegister
                        ? 'Não foi possível criar a conta.'
                        : 'E-mail ou senha inválidos.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        const nextIsRegister = !isRegister;
        setIsRegister(nextIsRegister);
        setError('');
        setPassword('');
        if (nextIsRegister) {
            setEmail('');
            setName('');
        } else {
            const saved = getSavedEmail() || localStorage.getItem(SAVED_EMAIL_KEY) || '';
            setEmail(saved);
        }
    };

    const nextBackgroundIndex =
        (backgroundIndex + 1) % BACKGROUNDS.length;

    return (
        <div className="login-page">

            {/* FUNDO */}
            <div
                className={`login-bg login-bg-current ${
                    isTransitioning ? 'slide-out' : ''
                }`}
                style={{
                    backgroundImage: `url(${BACKGROUNDS[backgroundIndex]})`,
                }}
            />

            {isTransitioning && (
                <div
                    className="login-bg login-bg-next slide-in"
                    style={{
                        backgroundImage: `url(${BACKGROUNDS[nextBackgroundIndex]})`,
                    }}
                />
            )}

            <div className="login-overlay" />

            {/* CARD */}
            <div className="login-card">

                {/* LOGO */}
                <div className="login-logo">
                    <img src="/logo.png" alt="LoreDex" />
                </div>

                {/* TÍTULO */}
                <h1>
                    {isRegister ? (
                        <>
                            Criar conta no <span>LoreDex</span>
                        </>
                    ) : (
                        <>
                            Bem-vindo ao <span>LoreDex</span>
                        </>
                    )}
                </h1>

                {/* SUBTÍTULO */}
                <p className="login-subtitle">
                    {isRegister
                        ? 'Crie sua conta para organizar suas obras favoritas.'
                        : 'Entre para continuar de onde parou.'}
                </p>

                <form onSubmit={handleSubmit}>

                    {/* NOME */}
                    {isRegister && (
                        <div className="login-field">
                            <input
                                type="text"
                                placeholder="Nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>
                    )}

                    {/* E-MAIL */}
                    <div className="login-field">
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />

                        <span className="login-icon">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="3"
                                    y="5"
                                    width="18"
                                    height="14"
                                    rx="2"
                                />

                                <polyline points="3 7 12 13 21 7" />
                            </svg>
                        </span>
                    </div>

                    {/* SENHA */}
                    <div className="login-field">
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={
                                isRegister
                                    ? 'new-password'
                                    : 'current-password'
                            }
                            minLength={6}
                            required
                        />

                        <button
                            type="button"
                            className="login-eye"
                            onClick={() => setShowPass(!showPass)}
                            title={
                                showPass
                                    ? 'Ocultar senha'
                                    : 'Mostrar senha'
                            }
                            aria-label={
                                showPass
                                    ? 'Ocultar senha'
                                    : 'Mostrar senha'
                            }
                        >
                            {showPass ? (
                                /* OLHO ABERTO */
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />

                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="2.5"
                                    />
                                </svg>
                            ) : (
                                /* OLHO FECHADO */
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 3l18 18" />

                                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

                                    <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 3.9" />

                                    <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.1-.8" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* LEMBRAR LOGIN */}
                    {!isRegister && (
                        <div className="login-options">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    checked={rememberLogin}
                                    onChange={(e) =>
                                        setRememberLogin(e.target.checked)
                                    }
                                />

                                Lembrar meu login
                            </label>
                        </div>
                    )}

                    {/* ERRO */}
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {/* BOTÃO */}
                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                    >
                        {loading
                            ? isRegister
                                ? 'Criando conta...'
                                : 'Entrando...'
                            : isRegister
                                ? 'Criar conta'
                                : 'Entrar'}
                    </button>

                </form>

                {/* TROCAR LOGIN / CADASTRO */}
                <div className="login-switch">
                    {isRegister
                        ? 'Já possui uma conta? '
                        : 'Primeira vez aqui? '}

                    <button
                        type="button"
                        onClick={toggleMode}
                    >
                        {isRegister
                            ? 'Entrar'
                            : 'Criar uma conta'}
                    </button>
                </div>

            </div>
        </div>
    );
}