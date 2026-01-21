import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Tooltip } from 'antd';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import aiIcon from '@/assets/ai-icon.svg';

export default function Dashboard({
    projects: initialProjects = [],
    chatOnly = false,
    chatProject = null,
    chatMessages = [],
    chatHistory = [],
    chatQuestionsAsked = 0,
    chatPendingIntent = null,
    chatIntentOptions = [],
}) {
    const uid = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

    const [projects, setProjects] = useState(initialProjects);
    const [activeProject, setActiveProject] = useState(chatProject);
    const [messages, setMessages] = useState(chatMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState(chatHistory);
    const [questionsAsked, setQuestionsAsked] = useState(chatQuestionsAsked);
    const [typing, setTyping] = useState(false);
    const [headlineIndex, setHeadlineIndex] = useState(0);
    const [headlineText, setHeadlineText] = useState('');
    const [headlinePhase, setHeadlinePhase] = useState('typing');
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualLoading, setManualLoading] = useState(false);
    const [manualError, setManualError] = useState('');
    const [finalizeRequested, setFinalizeRequested] = useState(false);
    const chatRef = useRef(null);
    const inputRef = useRef(null);
    const shouldShowChatBox = chatOnly || messages.length > 0 || typing;
    const [pendingIntent, setPendingIntent] = useState(chatPendingIntent);
    const [intentOptions, setIntentOptions] = useState(chatIntentOptions);
    const headlinePhrases = [
        'Vamos criar seu próximo projeto?',
        'Descreva sua ideia e receba um briefing instantâneo.',
        'Organize decisões técnicas com impacto no negócio.',
        'Tudo pronto? Então vamos lá!'
    ];

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    useEffect(() => {
        if (chatProject && !activeProject) {
            setActiveProject(chatProject);
        }
    }, [chatProject, activeProject]);

    useEffect(() => {
        setFinalizeRequested(false);
    }, [activeProject?.id]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages, typing]);

    useEffect(() => {
        if (inputRef.current && !showManualModal) {
            inputRef.current.focus();
        }
    }, [shouldShowChatBox, loading, showManualModal]);

    useEffect(() => {
        const current = headlinePhrases[headlineIndex];
        const pauseRequested = input.trim().length > 0;

        if (headlinePhase === 'paused') {
            if (!pauseRequested) {
                if (headlineText === '') {
                    setHeadlinePhase('typing');
                } else if (headlineText === current) {
                    setHeadlinePhase('holding');
                } else {
                    setHeadlinePhase('typing');
                }
            }
            return undefined;
        }

        if (pauseRequested) {
            if (headlinePhase === 'typing' && headlineText !== current) {
                const timeout = setTimeout(() => {
                    setHeadlineText(current.slice(0, headlineText.length + 1));
                }, 46);
                return () => clearTimeout(timeout);
            }

            setHeadlinePhase('paused');
            return undefined;
        }

        if (headlinePhase === 'typing') {
            if (headlineText === current) {
                const wait = setTimeout(() => {
                    setHeadlinePhase('holding');
                }, 5000);
                return () => clearTimeout(wait);
            }

            const timeout = setTimeout(() => {
                setHeadlineText(current.slice(0, headlineText.length + 1));
            }, 46);
            return () => clearTimeout(timeout);
        }

        if (headlinePhase === 'holding') {
            const wait = setTimeout(() => {
                setHeadlinePhase('deleting');
            }, 5000);
            return () => clearTimeout(wait);
        }

        if (headlinePhase === 'deleting') {
            if (headlineText === '') {
                if (headlineIndex === headlinePhrases.length - 1) {
                    setHeadlinePhase('cyclePause');
                    return undefined;
                }
                setHeadlineIndex((prev) => prev + 1);
                setHeadlinePhase('typing');
                return undefined;
            }

            const timeout = setTimeout(() => {
                setHeadlineText(current.slice(0, headlineText.length - 1));
            }, 12);
            return () => clearTimeout(timeout);
        }

        if (headlinePhase === 'cyclePause') {
            setHeadlineIndex(0);
            setHeadlinePhase('typing');
        }
    }, [headlineIndex, headlineText, headlinePhase, headlinePhrases, input]);

    const addMessage = (author, content) => {
        setMessages((prev) => [
            ...prev,
            { id: uid(), author, content, timestamp: new Date().toISOString() },
        ]);
    };

    const upsertProject = (project) => {
        setProjects((prev) => {
            const filtered = prev.filter((p) => p.id !== project.id);
            return [project, ...filtered];
        });
        setActiveProject(project);
    };

    const renderTyping = () =>
        typing ? (
            <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-3 py-3 text-gray-700 shadow-sm">
                    <span className="typing-dot" style={{ animationDelay: '0s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        ) : null;

    const canFinalize =
        Boolean(activeProject) &&
        !pendingIntent &&
        questionsAsked >= 1 &&
        !loading &&
        !typing &&
        !finalizeRequested;

    const submitMessage = async (content, extraPayload = {}) => {
        const trimmed = (content ?? '').trim();
        if (!trimmed) return;

        addMessage('user', trimmed);
        setLoading(true);
        setTyping(true);

        try {
            if (!activeProject) {
                const { data } = await axios.post(
                    route('projects.chat.start'),
                    { message: trimmed, history },
                );
                upsertProject(data.project);
                router.visit(route('chat.show', data.project.uuid), {
                    replace: true,
                    preserveState: true,
                    preserveScroll: true,
                });
                setHistory(data.history || []);
                setQuestionsAsked(Number.isInteger(data.questionsAsked) ? data.questionsAsked : 0);
                if (data.message) {
                    addMessage('assistant', data.message);
                }
                if (data.questionType === 'business_intent') {
                    setPendingIntent(data.message || null);
                    setIntentOptions(data.options || []);
                }
            } else {
                const newHistory = [...history, { role: 'user', content: trimmed }];
                const { data } = await axios.post(
                    route('projects.chat.answer', activeProject.id),
                    { answer: trimmed, history: newHistory, questionsAsked, ...extraPayload },
                );
                upsertProject(data.project);
                if (data.needs_more) {
                    if (data.message) {
                        addMessage('assistant', data.message);
                    }
                    if (data.history) {
                        setHistory(data.history);
                    } else if (data.message) {
                        setHistory([
                            ...newHistory,
                            { role: 'assistant', content: data.message },
                        ]);
                    } else {
                        setHistory(newHistory);
                    }
                    setQuestionsAsked(
                        Number.isInteger(data.questionsAsked)
                            ? data.questionsAsked
                            : questionsAsked + 1,
                    );
                } else {
                    if (data.summary?.overview) {
                        addMessage('assistant', data.summary.overview);
                    }
                    if (data.history) {
                        setHistory(data.history);
                    } else {
                        setHistory([]);
                    }
                    setQuestionsAsked(0);
                    router.visit(route('projects.show', data.project.uuid));
                }
            }
        } catch (error) {
        } finally {
            setLoading(false);
            setTyping(false);
        }
    };

    const handleFinalize = async () => {
        if (!activeProject || loading) return;
        setFinalizeRequested(true);
        setLoading(true);
        setTyping(true);

        try {
            const { data } = await axios.post(
                route('projects.chat.finalize', activeProject.id),
            );
            if (data?.project) {
                upsertProject(data.project);
                router.visit(route('projects.show', data.project.uuid));
            }
        } catch (error) {
            setFinalizeRequested(false);
        } finally {
            setLoading(false);
            setTyping(false);
        }
    };

    const openManualModal = () => {
        setManualError('');
        setManualTitle('');
        setShowManualModal(true);
    };

    const closeManualModal = () => {
        if (manualLoading) return;
        setShowManualModal(false);
    };

    const handleManualCreate = async () => {
        const title = manualTitle.trim();
        if (!title) {
            setManualError('Informe um título para continuar.');
            return;
        }

        setManualLoading(true);
        setManualError('');
        try {
            const { data } = await axios.post(route('projects.manual.create'), {
                title,
            });
            if (data?.project) {
                upsertProject(data.project);
                setShowManualModal(false);
                router.visit(route('projects.show', data.project.uuid));
            }
        } catch (error) {
            setManualError('Não foi possível criar o projeto agora.');
        } finally {
            setManualLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const content = input.trim();
        setInput('');
        await submitMessage(content);
    };

    const handleIntentSelect = async (intentValue, intentLabel) => {
        setPendingIntent(null);
        setIntentOptions([]);
        setInput('');
        await submitMessage(intentLabel, { intent: intentValue });
    };

    const bubbleClass = (author) => {
        const base =
            'relative max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm shadow-sm';
        if (author === 'user') {
            return `${base} ml-auto bg-[var(--color-primary)] text-white`;
        }
        return `${base} bg-[var(--color-surface-2)] text-[var(--color-dark)]`;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const Bubble = ({ author, timestamp, children }) => (
        <div
            className={`flex ${author === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`${bubbleClass(author)}`}>
                <span
                    className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 ${author === 'user'
                            ? 'right-[-6px] bg-[var(--color-primary)]'
                            : 'left-[-6px] bg-[var(--color-surface-2)]'
                        }`}
                />
                <div className="flex flex-col gap-1">
                    <div>{children}</div>
                    {timestamp && (
                        <span
                            className={`text-[10px] ${author === 'user' ? 'text-white/70' : 'text-gray-500'
                                }`}
                        >
                            {formatTime(timestamp)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Dashboard" />

            <div className="bg-[var(--color-surface)] py-8">
                <div
                    className={`mx-auto px-4 ${!shouldShowChatBox ? 'flex min-h-[70vh] flex-col justify-center pt-16' : ''} ${shouldShowChatBox ? 'max-w-[70%]' : 'max-w-[55%]'}`}
                >
                    {!shouldShowChatBox && (
                        <h1 className="mb-6 text-center text-2xl font-semibold text-[var(--color-dark)]">
                            {headlineText}
                            <span className="ml-1 animate-pulse text-[var(--color-secondary)]">
                                |
                            </span>
                        </h1>
                    )}

                    {!shouldShowChatBox && (
                        <form
                            onSubmit={handleSend}
                            className="mx-auto flex w-full max-w-[95%] items-center gap-3 rounded-full border border-[var(--color-secondary)]/20 bg-white px-5 py-4 shadow-lg relative"
                        >
                            <input
                                id="chat-input-initial"
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Descreva a ideia do projeto..."
                                className="flex-1 rounded-full border-none px-4 py-3 text-[16px] text-[var(--color-dark)] focus:outline-none focus:ring-0 focus:ring-offset-0 select-none"
                                disabled={loading}
                                autoFocus
                                autoComplete='false'
                            />
                            {loading && (
                                <span className="input-shimmer rounded-full" />
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                aria-label="Enviar mensagem"
                                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FiArrowUp className="h-5 w-5" />
                            </button>
                        </form>
                    )}
                    {!shouldShowChatBox && (
                        <div className="mt-3 text-center">
                            <button
                                type="button"
                                onClick={openManualModal}
                                className="text-sm font-semibold text-[var(--color-secondary)] underline decoration-[var(--color-secondary)]/60 transition hover:brightness-110"
                            >
                                Criar manualmente
                            </button>
                        </div>
                    )}

                    {shouldShowChatBox && (
                        <div
                            className="rounded-3xl border border-[var(--color-secondary)]/10 bg-white shadow-xl shadow-[0_12px_30px_rgba(91,33,182,0.08)] transition-all duration-500 ease-out"
                            style={{
                                minHeight: 'calc(90vh - 64px)',
                                maxHeight: 'calc(90vh - 64px)',
                                transform: 'scale(1)',
                                opacity: 1,
                            }}
                        >
                            <div
                                ref={chatRef}
                                className="space-y-4 overflow-y-auto bg-white px-6 py-5 rounded-tl-[12px] rounded-tr-[12px]"
                                style={{
                                    minHeight: 'calc(93vh - 64px - 140px)',
                                    maxHeight: 'calc(93vh - 64px - 140px)',
                                }}
                            >
                                {messages.map((message) => (
                                    <Bubble
                                        key={message.id}
                                        author={message.author}
                                        timestamp={message.timestamp}
                                    >
                                        {message.content}
                                    </Bubble>
                                ))}

                                {canFinalize && (
                                    <Bubble author="assistant">
                                        <Tooltip
                                            title="Você pode encerrar a qualquer momento a partir de 2 perguntas."
                                            placement="top"
                                        >
                                            <button
                                                type="button"
                                                onClick={handleFinalize}
                                                disabled={loading}
                                                className="rounded-full border border-[var(--color-secondary)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-secondary)] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Finalizar
                                            </button>
                                        </Tooltip>
                                    </Bubble>
                                )}

                                {renderTyping()}
                            </div>

                            <div className="border-t border-gray-100 px-6 py-4">
                                {pendingIntent && intentOptions.length > 0 && (
                                    <div className="rounded-xl border border-[var(--color-secondary)]/10 bg-[var(--color-surface-2)]/40 p-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                            {intentOptions.map((option) => {
                                                const tooltipText =
                                                    option.value === 'business'
                                                        ? 'Projetos com foco em receita, produto e resultados de negócio.'
                                                        : option.value === 'study'
                                                          ? 'Projetos de aprendizado, pesquisa ou capacitação técnica.'
                                                          : 'Software padrão para uso interno ou geral, sem foco específico.';
                                                return (
                                                    <Tooltip
                                                        key={option.value}
                                                        title={tooltipText}
                                                        placement="top"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleIntentSelect(option.value, option.label)
                                                            }
                                                            className="font-display flex items-center justify-center gap-2 rounded-lg border border-[var(--color-secondary)]/20 bg-white px-3 py-2 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                                                        >
                                                            <span className="h-3 w-3 rounded-sm border border-[var(--color-secondary)]/40 bg-white" />
                                                            {option.label}
                                                        </button>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {!pendingIntent && (
                                    <form onSubmit={handleSend}>
                                        <label className="sr-only" htmlFor="chat-input">
                                            Entrada do chat do projeto
                                        </label>
                                        <div className="flex w-full items-center gap-3">
                                        <div className="relative flex w-full items-center gap-2 rounded-full border border-gray-200 px-3 py-2 shadow-sm">
                                            <Tooltip title="Assistente IA">
                                                    <img
                                                        src={aiIcon}
                                                        alt="Assistente IA"
                                                        className="h-8 w-8 text-[var(--color-secondary)]"
                                                    />
                                            </Tooltip>
                                            <input
                                                id="chat-input"
                                                ref={inputRef}
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    placeholder="Digite a ideia do projeto ou responda..."
                                                    className="flex-1 rounded-full border-0 px-2 text-sm text-[var(--color-dark)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                                                disabled={loading}
                                                autoFocus
                                            />
                                            {loading && (
                                                <span className="input-shimmer rounded-full" />
                                            )}
                                        </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                aria-label="Enviar mensagem"
                                                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <FiArrowUp className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
            {showManualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="text-lg font-semibold text-[var(--color-dark)]">
                            Criar projeto manualmente
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Informe um título para o seu projeto.
                        </p>
                        <input
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            placeholder="Ex: Safio Studio"
                            className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-dark)] outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20"
                            autoFocus
                        />
                        {manualError && (
                            <p className="mt-2 text-xs text-red-500">
                                {manualError}
                            </p>
                        )}
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeManualModal}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleManualCreate}
                                disabled={manualLoading}
                                className="rounded-full bg-[var(--color-secondary)] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {manualLoading ? 'Criando...' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
