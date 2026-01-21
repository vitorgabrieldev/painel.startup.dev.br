import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router } from '@inertiajs/react';
import { Card, List, Space, Tooltip } from 'antd';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiEye } from 'react-icons/fi';

export default function Dashboard({ projects: initialProjects = [] }) {
    const uid = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

    const [projects, setProjects] = useState(initialProjects);
    const [activeProject, setActiveProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [questionsAsked, setQuestionsAsked] = useState(0);
    const [typing, setTyping] = useState(false);
    const chatRef = useRef(null);
    const inputRef = useRef(null);
    const shouldShowChatBox = messages.length > 0 || typing;
    const [pendingIntent, setPendingIntent] = useState(null);
    const [intentOptions, setIntentOptions] = useState([]);

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages, typing]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [shouldShowChatBox, loading]);

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
                    setHistory([]);
                    setQuestionsAsked(0);
                    router.visit(route('projects.show', data.project.id));
                }
            }
        } catch (error) {
        } finally {
            setLoading(false);
            setTyping(false);
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

    const recentProjects = useMemo(() => projects.slice(0, 5), [projects]);

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
                    className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 ${
                        author === 'user'
                            ? 'right-[-6px] bg-[var(--color-primary)]'
                            : 'left-[-6px] bg-[var(--color-surface-2)]'
                    }`}
                />
                <div className="flex flex-col gap-1">
                    <div>{children}</div>
                    {timestamp && (
                        <span
                            className={`text-[10px] ${
                                author === 'user' ? 'text-white/70' : 'text-gray-500'
                            }`}
                        >
                            {formatTime(timestamp)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    const projectButtonTarget =
        activeProject?.id || recentProjects[0]?.id || null;

    const statusLabel = (status) => {
        if (status === 'active') return 'ativo';
        if (status === 'draft') return 'rascunho';
        if (status === 'archived') return 'arquivado';
        return status || '';
    };

    return (
        <AuthenticatedLayout header={null}>
            <Head title="Dashboard" />

            <div className="bg-[var(--color-surface)] py-8">
                <div className="mx-auto max-w-4xl px-4">
                    {!shouldShowChatBox && (
                        <h1 className="mb-6 text-center text-2xl font-semibold text-[var(--color-dark)]">
                            Vamos criar seu próximo projeto?
                        </h1>
                    )}

                    {!shouldShowChatBox && (
                        <form
                            onSubmit={handleSend}
                            className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-[var(--color-secondary)]/20 bg-white px-5 py-4 shadow-lg"
                        >
                            <input
                                id="chat-input-initial"
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Descreva a ideia do projeto..."
                                className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                                disabled={loading}
                                autoFocus
                            />
                            <PrimaryButton
                                type="submit"
                                disabled={loading}
                                variant="purple"
                                className="!text-white !rounded-full"
                            >
                                {loading ? 'Enviando...' : 'Enviar'}
                            </PrimaryButton>
                        </form>
                    )}

                    {shouldShowChatBox && (
                        <div
                            className="rounded-3xl border border-[var(--color-secondary)]/10 bg-white shadow-xl shadow-[0_12px_30px_rgba(91,33,182,0.08)] transition-all duration-500 ease-out"
                            style={{
                                minHeight: '90vh',
                                maxHeight: '90vh',
                                transform: 'scale(1)',
                                opacity: 1,
                            }}
                        >
                            <div
                                ref={chatRef}
                                className="space-y-4 overflow-y-auto bg-white px-6 py-5"
                                style={{ minHeight: 'calc(90vh - 140px)', maxHeight: 'calc(90vh - 140px)' }}
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

                                {renderTyping()}
                            </div>

                            <div className="border-t border-gray-100 px-6 py-4">
                                {pendingIntent && intentOptions.length > 0 && (
                                    <div className="rounded-xl border border-[var(--color-secondary)]/10 bg-[var(--color-surface-2)]/40 p-4 text-sm text-gray-700">
                                        <p className="font-display font-semibold text-[var(--color-dark)]">
                                            {pendingIntent}
                                        </p>
                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                            {intentOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        handleIntentSelect(option.value, option.label)
                                                    }
                                                    className="font-display flex items-center justify-center gap-2 rounded-lg border border-[var(--color-secondary)]/20 bg-white px-3 py-2 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                                                >
                                                    <span className="h-3 w-3 rounded-sm border border-[var(--color-secondary)]/40 bg-white" />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!pendingIntent && (
                                    <form onSubmit={handleSend}>
                                        <label className="sr-only" htmlFor="chat-input">
                                            Entrada do chat do projeto
                                        </label>
                                        <div className="flex w-full items-center gap-3">
                                            <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 px-3 py-2 shadow-sm">
                                                <Tooltip title="Assistente IA">
                                                    <span className="text-[var(--color-secondary)]">
                                                        ✨
                                                    </span>
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
                                            </div>
                                            <PrimaryButton
                                                type="submit"
                                                disabled={loading}
                                                variant="purple"
                                                className="!text-white !rounded-full"
                                            >
                                                {loading ? 'Enviando...' : 'Enviar'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-auto mt-6 max-w-4xl px-4">
                    <Card
                        title="Projetos recentes"
                        extra={
                            <PrimaryButton
                                variant="red"
                                disabled={!projectButtonTarget}
                                onClick={() =>
                                    projectButtonTarget &&
                                    router.visit(route('projects.show', projectButtonTarget))
                                }
                                className="!text-white"
                            >
                                Ver todos os projetos
                            </PrimaryButton>
                        }
                        className="shadow-md"
                    >
                        {recentProjects.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                Nenhum projeto ainda. Envie a primeira ideia no chat.
                            </p>
                        ) : (
                            <List
                                itemLayout="horizontal"
                                dataSource={recentProjects}
                                renderItem={(project) => (
                                    <List.Item
                                        key={project.id}
                                        actions={[
                                            <Space key="actions" size={8}>
                                                <Tooltip title="Ver detalhes do projeto">
                                                    <span>
                                                        <PrimaryButton
                                                            variant="outlineRed"
                                                            className="!px-3 !py-1"
                                                            onClick={() =>
                                                                router.visit(route('projects.show', project.id))
                                                            }
                                                        >
                                                            <FiEye className="mr-1" /> Visualizar
                                                        </PrimaryButton>
                                                    </span>
                                                </Tooltip>
                                            </Space>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <span className="line-clamp-1 text-[var(--color-dark)]">
                                                    {project.name}
                                                </span>
                                            }
                                            description={
                                                <Space size={6}>
                                                    <span className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-[11px] font-semibold text-white uppercase">
                                                        {statusLabel(project.status)}
                                                    </span>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
