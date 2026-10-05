import { useState, useEffect } from 'react';
import { login, register } from '../services/api';
import '../../css/login.css';


const BACKGROUNDS = [
    '/images/login/animes1.jpeg',
    '/images/login/animes2.jpeg',
    '/images/login/animes3.jpeg',
];

export default function Login({ onSuccess }) {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [bg, setBg] = useState(0);

    // Troca o papel de parede a cada 7 segundos
    useEffect(() => {
        const id = setInterval(() => setBg((i) => (i + 1) % BACKGROUNDS.length), 7000);
        return () => clearInterval(id);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = isRegister
                ? await register(name, email, password)
                : await login(email, password);
            onSuccess(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
    };

    return (
        <div className="login-page">
            {BACKGROUNDS.map((src, i) => (
                <div
                    key={src}
                    className={`login-bg ${i === bg ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${src})` }}
                />
            ))}
            <div className="login-overlay" />

            <div className="login-card">
                <p className="login-kicker">
                    {isRegister ? 'crie sua conta' : 'acesse sua conta'}
                </p>
                <h1 className="login-title">
                    {isRegister ? 'Comece sua jornada' : 'Bem-vindo ao LoreDex'}
                </h1>
                <p className="login-subtitle">
                    {isRegister
                        ? 'Cadastre-se para organizar suas novels, mangás e animes.'
                        : 'Entre para continuar de onde parou.'}
                </p>

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegister && (
                        <div className="login-field">
                            <label>nome</label>
                            <input
                                type="text"
                                placeholder="Como quer ser chamado?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="login-field">
                        <label>e-mail</label>
                        <input
                            type="email"
                            placeholder="voce@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label>senha</label>
                        <div className="login-pass">
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder={isRegister ? 'Mínimo 6 caracteres' : 'Sua senha'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                className="login-eye"
                                onClick={() => setShowPass(!showPass)}
                                aria-label="Mostrar ou ocultar senha"
                            >
                                {showPass ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
                    </button>
                </form>

                <p className="login-switch">
                    {isRegister ? 'Já tem uma conta?' : 'Primeira vez aqui?'}{' '}
                    <button type="button" onClick={toggleMode}>
                        {isRegister ? 'Entrar' : 'Criar uma conta'}
                    </button>
                </p>
            </div>
        </div>
    );
}