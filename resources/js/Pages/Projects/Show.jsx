import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    Checkbox,
    Form,
    Input,
    Modal,
    Select,
    message,
    List,
    Tabs,
    Tooltip,
    Tag,
} from 'antd';
import {
    FiAlertTriangle,
    FiArrowDown,
    FiArrowUp,
    FiMessageSquare,
    FiClipboard,
    FiClock,
    FiEdit2,
    FiFileText,
    FiGitBranch,
    FiSettings,
    FiHome,
    FiInfo,
    FiLayers,
    FiLink,
    FiMonitor,
    FiSearch,
    FiShield,
    FiCheckSquare,
} from 'react-icons/fi';

const { TextArea } = Input;
const SEARCH_HISTORY_KEY = 'project.module.search.history';
const InfoLabel = ({ text, tooltip }) => (
    <div className="flex items-center gap-2">
        <span>{text}</span>
        <Tooltip title={tooltip}>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-500">
                <FiInfo className="h-3 w-3" />
            </span>
        </Tooltip>
    </div>
);

const Section = ({ title, titleTooltip, action, children, subtitle }) => (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
            <div>
                {titleTooltip ? (
                    <Tooltip title={titleTooltip} placement="topLeft">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                    </Tooltip>
                ) : (
                    <h3 className="font-display text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="mt-1 text-sm font-medium text-gray-600">
                        {subtitle}
                    </p>
                )}
            </div>
        {action}
        </div>
        <div className="text-sm text-gray-700">{children}</div>
    </section>
);

const EmptyState = ({ icon: Icon, message = 'Não há nada aqui : \\' }) => (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 text-center">
        <span className="rounded-lg bg-red-500/10 p-3 text-red-500">
            <Icon className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
);

const statusLabel = (status) => {
    if (status === 'active') return 'ativo';
    if (status === 'draft') return 'rascunho';
    if (status === 'archived') return 'arquivado';
    return status || '';
};

const parseMaybeJson = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const looksJson =
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'));
        if (looksJson) {
            try {
                return JSON.parse(trimmed);
            } catch (error) {
                return value;
            }
        }
        return value;
    }
    return value;
};

const normalizeText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return '';
};

const normalizeList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => normalizeText(item)).filter(Boolean);
    }
    if (typeof value === 'string') {
        const text = value.trim();
        return text ? [text] : [];
    }
    return [];
};

const humanizeKey = (key) =>
    key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const toPlainText = (value) => {
    const parsed = parseMaybeJson(value);
    if (!parsed) return '';
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed)) {
        return normalizeList(parsed).join(', ');
    }
    if (typeof parsed === 'object') {
        return Object.entries(parsed)
            .map(([key, item]) => {
                const text = Array.isArray(item)
                    ? normalizeList(item).join(', ')
                    : normalizeText(item);
                if (!text) return null;
                return `${humanizeKey(key)}: ${text}`;
            })
            .filter(Boolean)
            .join(' | ');
    }
    return String(parsed);
};

const formatStackStatus = (status) => {
    if (status === 'chosen') return 'Selecionada';
    if (status === 'evaluating') return 'Avaliando';
    if (status === 'deprecated') return 'Depreciada';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
};

export default function Show({ project: initialProject }) {
    const [project, setProject] = useState(initialProject);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [isMobileBlocked, setIsMobileBlocked] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarProcessing, setAvatarProcessing] = useState(false);
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiConfigOpen, setAiConfigOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const aiChatRef = useRef(null);
    const [aiContext, setAiContext] = useState({
        overview: true,
        purpose: true,
        scope: true,
        targetUsers: true,
        stack: true,
        patterns: true,
        risks: true,
        integrations: true,
        governance: true,
        nfrs: true,
        decisions: true,
        chatHistory: true,
    });

    const [editingOverview, setEditingOverview] = useState(false);
    const [overviewForm] = Form.useForm();

    const [stackModal, setStackModal] = useState(false);
    const [stackForm] = Form.useForm();
    const [editingStack, setEditingStack] = useState(null);

    const [patternModal, setPatternModal] = useState(false);
    const [patternForm] = Form.useForm();

    const [riskModal, setRiskModal] = useState(false);
    const [riskForm] = Form.useForm();

    const [integrationModal, setIntegrationModal] = useState(false);
    const [integrationForm] = Form.useForm();

    const [govModal, setGovModal] = useState(false);
    const [govForm] = Form.useForm();

    const [nfrModal, setNfrModal] = useState(false);
    const [nfrForm] = Form.useForm();

    const [decisionModal, setDecisionModal] = useState(false);
    const [decisionForm] = Form.useForm();
    const [activeTab, setActiveTab] = useState('overview');
    const [tagFilters, setTagFilters] = useState({
        stack: [],
        patterns: [],
        risks: [],
        integrations: [],
        governance: [],
        nfrs: [],
        decisions: [],
    });
    const [searchHistory, setSearchHistory] = useState({
        stack: [],
        patterns: [],
        risks: [],
        integrations: [],
        governance: [],
        nfrs: [],
        decisions: [],
    });
    const [sortBy, setSortBy] = useState({
        stack: 'title',
        patterns: 'title',
        risks: 'title',
        integrations: 'title',
        governance: 'title',
        nfrs: 'title',
        decisions: 'title',
    });
    const [sortDirection, setSortDirection] = useState({
        stack: 'asc',
        patterns: 'asc',
        risks: 'asc',
        integrations: 'asc',
        governance: 'asc',
        nfrs: 'asc',
        decisions: 'asc',
    });
    const [statusFilters] = useState({
        stack: '',
        patterns: '',
        governance: '',
        nfrs: '',
        decisions: '',
    });

    useEffect(() => {
        setProject(initialProject);
        overviewForm.setFieldsValue({
            overview: toPlainText(initialProject.overview),
            purpose: toPlainText(initialProject.purpose),
            scope: toPlainText(initialProject.scope),
            target_users: toPlainText(initialProject.target_users),
        });
    }, [initialProject, overviewForm]);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 1023px)');
        const update = () => setIsMobileBlocked(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!aiChatOpen || !aiChatRef.current) return;
        aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
    }, [aiChatOpen, aiMessages, aiLoading]);

    const sendAiMessage = async () => {
        const content = aiInput.trim();
        if (!content || aiLoading) return;

        setAiError('');
        setAiInput('');
        const newMessages = [...aiMessages, { role: 'user', content }];
        setAiMessages(newMessages);
        setAiLoading(true);

        try {
            const history = newMessages.slice(-8).map((item) => ({
                role: item.role,
                content: item.content,
            }));
            const { data } = await axios.post(
                route('projects.ai.chat', project.id),
                {
                    message: content,
                    history,
                    context: aiContext,
                },
            );
            if (data?.message) {
                setAiMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: data.message },
                ]);
            } else {
                throw new Error('empty_response');
            }
        } catch (error) {
            setAiError('Não foi possível responder agora.');
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                setSearchHistory((prev) => ({
                    ...prev,
                    ...parsed,
                }));
            }
        } catch (error) {
            // ignore storage errors
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
        } catch (error) {
            // ignore storage errors
        }
    }, [searchHistory]);

    const avatarUrl = useMemo(() => {
        if (avatarPreview) return avatarPreview;
        if (!project.avatar_url) return null;
        return `${project.avatar_url}?v=${project.updated_at || project.id}`;
    }, [avatarPreview, project]);

    const projectInitial =
        (project.name || '').trim().charAt(0).toUpperCase() || '?';

    const handleProjectAvatar = async (file) => {
        if (!file) return;
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarProcessing(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const { data } = await axios.post(
                route('projects.avatar.update', project.id),
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            setProject(data);
            messageApi.success('Avatar atualizado.');
        } catch (error) {
            messageApi.error('Erro ao atualizar avatar.');
        } finally {
            setAvatarProcessing(false);
        }
    };

    const renderPlainValue = (value, fallback) => {
        const parsed = parseMaybeJson(value);
        if (!parsed) return fallback;
        if (typeof parsed === 'string') return parsed;
        if (Array.isArray(parsed)) {
            const items = normalizeList(parsed);
            return items.length ? items.join(', ') : fallback;
        }
        if (typeof parsed === 'object') {
            const pairs = Object.entries(parsed)
                .map(([key, item]) => {
                    const text = Array.isArray(item)
                        ? normalizeList(item).join(', ')
                        : normalizeText(item);
                    if (!text) return null;
                    return `${humanizeKey(key)}: ${text}`;
                })
                .filter(Boolean);
            return pairs.length ? pairs.join(' | ') : fallback;
        }
        return String(parsed);
    };

    const renderScopeValue = (value) => {
        const parsed = parseMaybeJson(value);
        if (!parsed) return 'Sem escopo definido.';
        if (typeof parsed === 'string') return parsed;
        if (Array.isArray(parsed)) {
            const items = normalizeList(parsed);
            return items.length ? items.join(', ') : 'Sem escopo definido.';
        }
        if (typeof parsed === 'object') {
            const sections = [
                {
                    title: 'Funcionalidades confirmadas',
                    items: normalizeList(parsed.funcionalidades_confirmadas),
                },
                {
                    title: 'Funcionalidades pendentes',
                    items: normalizeList(parsed.funcionalidades_pendentes),
                },
                {
                    title: 'Exclusões',
                    items: normalizeList(parsed.exclusoes),
                },
            ].filter((section) => section.items.length > 0);

            if (sections.length) {
                return (
                    <div className="space-y-2">
                        {sections.map((section) => (
                            <div key={section.title}>
                                <p className="text-xs font-semibold text-gray-600">
                                    {section.title}
                                </p>
                                <ul className="mt-1 list-disc space-y-1 pl-5">
                                    {section.items.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            }
        }

        return renderPlainValue(value, 'Sem escopo definido.');
    };

    const renderTargetUsers = (value) => {
        const parsed = parseMaybeJson(value);
        if (!parsed) return 'Não definido';
        if (typeof parsed === 'string') return parsed;
        if (Array.isArray(parsed)) {
            const items = normalizeList(parsed);
            return items.length ? items.join(', ') : 'Não definido';
        }
        if (typeof parsed === 'object') {
            const rows = [
                { label: 'Primários', value: parsed.primarios },
                { label: 'Secundários', value: parsed.secundarios },
                { label: 'Restrições', value: parsed.restricoes },
            ]
                .map((row) => ({
                    label: row.label,
                    value: Array.isArray(row.value)
                        ? normalizeList(row.value).join(', ')
                        : normalizeText(row.value),
                }))
                .filter((row) => row.value);

            if (rows.length) {
                return (
                    <div className="space-y-1">
                        {rows.map((row) => (
                            <div key={row.label}>
                                <span className="font-semibold text-gray-600">
                                    {row.label}:
                                </span>{' '}
                                <span>{row.value}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        }

        return renderPlainValue(value, 'Não definido');
    };

    const updateProject = async (values) => {
        setLoading(true);
        try {
            const { data } = await axios.patch(
                route('projects.update', project.id),
                values,
            );
            setProject(data);
            messageApi.success('Projeto atualizado.');
        } catch (error) {
            messageApi.error('Erro ao salvar projeto.');
        } finally {
            setLoading(false);
        }
    };

    const handleStackSave = async () => {
        setLoading(true);
        try {
            const values = stackForm.getFieldsValue();
            if (editingStack?.id) {
                const { data } = await axios.patch(
                    route('projects.stack.update', [project.id, editingStack.id]),
                    values,
                );
                setProject(data);
                messageApi.success('Stack atualizada.');
            } else {
                const { data } = await axios.post(
                    route('projects.stack.store', project.id),
                    values,
                );
                setProject(data);
                messageApi.success('Stack adicionada.');
            }
            setEditingStack(null);
            setStackModal(false);
            stackForm.resetFields();
        } catch (error) {
            messageApi.error('Erro ao salvar stack.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (routeName, form, onClose) => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                route(routeName, project.id),
                form.getFieldsValue(),
            );
            setProject(data);
            onClose();
            form.resetFields();
            messageApi.success('Item salvo.');
        } catch (error) {
            messageApi.error('Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    const stacks = useMemo(() => project.tech_stack_items || [], [project.tech_stack_items]);
    const patterns = useMemo(() => project.architecture_patterns || [], [project.architecture_patterns]);
    const risks = useMemo(() => project.risks || [], [project.risks]);
    const integrations = useMemo(() => project.integration_links || [], [project.integration_links]);
    const governance = useMemo(() => project.governance_rules || [], [project.governance_rules]);
    const nfrs = useMemo(() => project.non_functional_requirements || [], [project.non_functional_requirements]);
    const decisions = useMemo(() => project.decision_records || [], [project.decision_records]);

    const normalizeSearchText = (value) =>
        String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const getModuleTitleKey = (moduleKey) => {
        switch (moduleKey) {
            case 'risks':
                return 'title';
            case 'integrations':
                return 'label';
            case 'nfrs':
                return 'category';
            default:
                return 'name';
        }
    };

    const getModuleSearchText = (moduleKey, item) => {
        if (!item) return '';
        const values = [];
        switch (moduleKey) {
            case 'stack':
                values.push(
                    item.name,
                    item.category,
                    item.version,
                    item.rationale,
                    item.constraints,
                    item.vendor_url,
                    item.status,
                );
                break;
            case 'patterns':
                values.push(
                    item.name,
                    item.rationale,
                    item.references,
                    item.constraints,
                    item.status,
                );
                break;
            case 'risks':
                values.push(
                    item.title,
                    item.severity,
                    item.likelihood,
                    item.impact_area,
                    item.owner,
                    item.mitigation,
                );
                break;
            case 'integrations':
                values.push(item.label, item.type, item.url, item.notes);
                break;
            case 'governance':
                values.push(
                    item.name,
                    item.scope,
                    item.description,
                    item.requirements,
                    item.status,
                );
                break;
            case 'nfrs':
                values.push(
                    item.category,
                    item.metric,
                    item.target,
                    item.priority,
                    item.rationale,
                    item.current_assessment,
                );
                break;
            case 'decisions':
                values.push(
                    item.title,
                    item.status,
                    item.context,
                    item.decision,
                    item.consequences,
                );
                break;
            default:
                values.push(item.name, item.title);
        }
        return normalizeSearchText(values.filter(Boolean).join(' '));
    };

    const filterAndSort = (list, moduleKey, statusKey = 'status') => {
        const tags = (tagFilters[moduleKey] || [])
            .map((tag) => normalizeSearchText(tag.trim()))
            .filter((tag) => tag.length >= 3);

        const statusFilter = statusFilters[moduleKey] || '';

        const filtered = list.filter((item) => {
            const text = getModuleSearchText(moduleKey, item);
            const tagsMatch = tags.length
                ? tags.every((tag) => text.includes(tag))
                : true;
            const statusValue = normalizeSearchText(item[statusKey] || '');
            const statusMatch = statusFilter
                ? statusValue === normalizeSearchText(statusFilter)
                : true;
            return tagsMatch && statusMatch;
        });

        const direction = sortDirection[moduleKey] === 'asc' ? 1 : -1;
        const sortField = sortBy[moduleKey] || 'title';
        const titleKey = getModuleTitleKey(moduleKey);

        return [...filtered].sort((a, b) => {
            if (sortField === 'title') {
                const aTitle = String(a[titleKey] || '').toLowerCase();
                const bTitle = String(b[titleKey] || '').toLowerCase();
                return aTitle.localeCompare(bTitle, 'pt-BR') * direction;
            }
            const aDate = new Date(a[sortField] || 0).getTime();
            const bDate = new Date(b[sortField] || 0).getTime();
            return (aDate - bDate) * direction;
        });
    };

    const updateHistory = (moduleKey, tags) => {
        const trimmed = tags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length >= 3);
        if (!trimmed.length) return;
        setSearchHistory((prev) => {
            const next = [...trimmed, ...(prev[moduleKey] || [])];
            return {
                ...prev,
                [moduleKey]: [...new Set(next)].slice(0, 12),
            };
        });
    };

    const SearchSortBar = ({ moduleKey, placeholder }) => (
        <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <Tooltip title="Histórico de busca">
                    <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-100 text-gray-500 transition hover:text-[var(--color-secondary)]"
                    >
                        <FiClock className="h-4 w-4" />
                    </button>
                </Tooltip>
                <Select
                    mode="tags"
                    value={tagFilters[moduleKey]}
                    options={(searchHistory[moduleKey] || []).map((item) => ({
                        value: item,
                        label: item,
                    }))}
                    placeholder={placeholder}
                    className="flex-1"
                    variant="borderless"
                    showArrow={false}
                    onChange={(value) => {
                        setTagFilters((prev) => ({ ...prev, [moduleKey]: value }));
                        updateHistory(moduleKey, value);
                    }}
                    maxTagCount="responsive"
                />
                <Tooltip title="Buscar">
                    <Button
                        type="text"
                        className="flex h-8 w-8 items-center justify-center"
                        icon={<FiSearch />}
                    />
                </Tooltip>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm">
                <Tooltip title="Ordenar por">
                    <Select
                        value={sortBy[moduleKey]}
                        options={[
                            { label: 'Título', value: 'title' },
                            { label: 'Criado em', value: 'created_at' },
                            { label: 'Atualizado em', value: 'updated_at' },
                        ]}
                        onChange={(value) =>
                            setSortBy((prev) => ({ ...prev, [moduleKey]: value }))
                        }
                        className="min-w-[170px]"
                        variant="borderless"
                    />
                </Tooltip>
                <Tooltip
                    title={
                        sortDirection[moduleKey] === 'asc'
                            ? 'Crescente'
                            : 'Decrescente'
                    }
                >
                    <button
                        type="button"
                        onClick={() =>
                            setSortDirection((prev) => ({
                                ...prev,
                                [moduleKey]:
                                    prev[moduleKey] === 'asc' ? 'desc' : 'asc',
                            }))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-100 text-gray-600 transition hover:text-[var(--color-secondary)]"
                    >
                        {sortDirection[moduleKey] === 'asc' ? (
                            <FiArrowUp className="h-4 w-4" />
                        ) : (
                            <FiArrowDown className="h-4 w-4" />
                        )}
                    </button>
                </Tooltip>
            </div>
        </div>
    );

    if (isMobileBlocked) {
        return (
            <AuthenticatedLayout header={null}>
                <Head title={project.name} />
                <div className="flex min-h-[70vh] items-center justify-center bg-[var(--color-surface)] px-6 py-12">
                    <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                            <FiMonitor className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-gray-900">
                            Para melhor experiência, acesse no desktop
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Esta área foi otimizada para telas maiores. Em breve teremos versão mobile.
                        </p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <>
            <AuthenticatedLayout
                header={
                    <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-dark)]">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={`Avatar do projeto ${project.name}`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{projectInitial}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-semibold leading-tight text-gray-900">
                                {project.name}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]">
                            {avatarProcessing ? 'Enviando...' : 'Trocar avatar'}
                            <input
                                type="file"
                                accept="image/*"
                                disabled={avatarProcessing}
                                className="hidden"
                                onChange={(event) =>
                                    handleProjectAvatar(event.target.files?.[0])
                                }
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setAiConfigOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-gray-200 text-gray-500 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                            aria-label="Configurar contexto da IA"
                        >
                            <FiSettings className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAiChatOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-gray-200 text-gray-600 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                            aria-label="Abrir chat com IA"
                        >
                            <FiMessageSquare className="h-5 w-5" />
                        </button>
                    </div>
                    </div>
                }
            >
            {contextHolder}
            <Head title={project.name} />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <nav className="flex items-center gap-2 text-sm text-gray-500">
                            <Link
                                href={route('dashboard')}
                                className="flex items-center gap-1 text-gray-500 transition hover:text-[var(--color-secondary)]"
                            >
                                <FiHome className="h-4 w-4" />
                                Home
                            </Link>
                            <span className="text-gray-300">/</span>
                            <Link
                                href={route('projects.index')}
                                className="text-gray-500 transition hover:text-[var(--color-secondary)]"
                            >
                                Projetos
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-400">{project.name}</span>
                        </nav>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Tabs
                            tabPosition="left"
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            tabBarStyle={{ width: 240 }}
                            className="project-tabs"
                            items={[
                                {
                                    key: 'overview',
                                    label: (
                                        <Tooltip title="Resumo do projeto, propósito e escopo">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiFileText className="h-4 w-4" />
                                                </span>
                                                <span>Sobre/Escopo</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Sobre, propósito e escopo"
                                            titleTooltip="Resumo geral do projeto com objetivo e limites. Ex.: 'Marketplace de serviços locais com foco em PMEs'."
                                            action={
                                                <PrimaryButton
                                                    variant="outlineRed"
                                                    onClick={() => setEditingOverview(true)}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <FiEdit2 className="h-4 w-4" />
                                                        Editar
                                                    </span>
                                                </PrimaryButton>
                                            }
                                        >
                                            <p className="font-semibold text-gray-800">Sobre</p>
                                            <p>
                                                {renderPlainValue(
                                                    project.overview,
                                                    'Sem resumo ainda.',
                                                )}
                                            </p>
                                            <p className="mt-3 font-semibold text-gray-800">Propósito</p>
                                            <p>
                                                {renderPlainValue(
                                                    project.purpose,
                                                    'Sem propósito definido.',
                                                )}
                                            </p>
                                            <p className="mt-3 font-semibold text-gray-800">Escopo</p>
                                            <div>{renderScopeValue(project.scope)}</div>
                                            <div className="mt-3 text-xs text-gray-500">
                                                <span className="font-semibold text-gray-600">
                                                    Público-alvo:
                                                </span>
                                                <div className="mt-1">
                                                    {renderTargetUsers(project.target_users)}
                                                </div>
                                            </div>
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'stack',
                                    label: (
                                        <Tooltip title="Linguagens, frameworks, bancos e infra">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiLayers className="h-4 w-4" />
                                                </span>
                                                <span>Stack técnica</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Stack técnica"
                                            titleTooltip="Tecnologias do produto. Ex.: React, Laravel, PostgreSQL, Redis, AWS."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        stackForm.resetFields();
                                                        setEditingStack(null);
                                                        setStackModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Linguagens, frameworks, bancos, infra e ferramentas."
                                        >
                                            <SearchSortBar
                                                moduleKey="stack"
                                                placeholder="Buscar stack"
                                            />
                                            {filterAndSort(stacks, 'stack').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(stacks, 'stack')}
                                                    renderItem={(item) => (
                                                        <List.Item
                                                            className="!w-full !px-0 !py-0"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                stackForm.setFieldsValue({
                                                                    ...item,
                                                                    constraints: toPlainText(item.constraints),
                                                                    rationale: toPlainText(item.rationale),
                                                                });
                                                                setEditingStack(item);
                                                                setStackModal(true);
                                                            }}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    stackForm.setFieldsValue({
                                                                        ...item,
                                                                        constraints: toPlainText(item.constraints),
                                                                        rationale: toPlainText(item.rationale),
                                                                    });
                                                                    setEditingStack(item);
                                                                    setStackModal(true);
                                                                }
                                                            }}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                                <div className="grid gap-1 sm:grid-cols-2 sm:items-center">
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-gray-800">
                                                                            {item.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-600">
                                                                            {item.category} {item.version ? `· ${item.version}` : ''}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-end">
                                                                        <Tag color="red">
                                                                            {formatStackStatus(item.status)}
                                                                        </Tag>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                                                                    {item.vendor_url && <span>Vendor: {item.vendor_url}</span>}
                                                                    {item.constraints && <span>Notas: {item.constraints}</span>}
                                                                </div>
                                                                {item.rationale && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Racional: {item.rationale}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiLayers} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'patterns',
                                    label: (
                                        <Tooltip title="Padrões de arquitetura adotados">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiGitBranch className="h-4 w-4" />
                                                </span>
                                                <span>Padrões</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Padrões de arquitetura"
                                            titleTooltip="Padrões e abordagens. Ex.: MVC, Clean Architecture, Event-driven, CQRS."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        patternForm.resetFields();
                                                        setPatternModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Padrões arquiteturais e estado de adoção."
                                        >
                                            <SearchSortBar
                                                moduleKey="patterns"
                                                placeholder="Buscar padrões"
                                            />
                                            {filterAndSort(patterns, 'patterns').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(patterns, 'patterns')}
                                                    renderItem={(pattern) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        patternForm.setFieldsValue(pattern);
                                                                        setPatternModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold">{pattern.name}</span>
                                                                    <Tag color="purple">{pattern.status}</Tag>
                                                                </div>
                                                                {pattern.rationale && (
                                                                    <div className="mt-1 text-xs text-gray-600">
                                                                        Racional: {pattern.rationale}
                                                                    </div>
                                                                )}
                                                                {pattern.references && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Referências: {pattern.references}
                                                                    </div>
                                                                )}
                                                                {pattern.constraints && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Restrições: {pattern.constraints}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiGitBranch} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'risks',
                                    label: (
                                        <Tooltip title="Riscos, impacto e mitigação">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiAlertTriangle className="h-4 w-4" />
                                                </span>
                                                <span>Riscos</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Riscos"
                                            titleTooltip="Riscos e mitigação. Ex.: atraso de integração, compliance, SLA, custo."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        riskForm.resetFields();
                                                        setRiskModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Mapa de riscos, impactos e mitigação."
                                        >
                                            <SearchSortBar
                                                moduleKey="risks"
                                                placeholder="Buscar riscos"
                                            />
                                            {filterAndSort(risks, 'risks').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(risks, 'risks')}
                                                    renderItem={(risk) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        riskForm.setFieldsValue(risk);
                                                                        setRiskModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <span className="font-semibold">{risk.title}</span>
                                                                    <Tag color="red">{risk.severity}</Tag>
                                                                    <Tag color="blue">{risk.likelihood}</Tag>
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-600">
                                                                    Impacto: {risk.impact_area || '—'}
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-600">
                                                                    Responsável: {risk.owner || '—'}
                                                                </div>
                                                                {risk.mitigation && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Mitigação: {risk.mitigation}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiAlertTriangle} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'integrations',
                                    label: (
                                        <Tooltip title="Integrações, links e ferramentas externas">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiLink className="h-4 w-4" />
                                                </span>
                                                <span>Integrações</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Integrações"
                                            titleTooltip="Integrações externas e links úteis. Ex.: GitHub, Jira, Stripe, Sentry."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        integrationForm.resetFields();
                                                        setIntegrationModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Links para repositórios, issues, PRs e docs."
                                        >
                                            <SearchSortBar
                                                moduleKey="integrations"
                                                placeholder="Buscar integrações"
                                            />
                                            {filterAndSort(integrations, 'integrations').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(integrations, 'integrations')}
                                                    renderItem={(link) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        integrationForm.setFieldsValue(link);
                                                                        setIntegrationModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold">{link.label}</span>
                                                                    <Tag color="blue">{link.type}</Tag>
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-600 break-all">
                                                                    {link.url}
                                                                </div>
                                                                {link.notes && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Notas: {link.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiLink} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'governance',
                                    label: (
                                        <Tooltip title="Regras, aprovações e processos">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiShield className="h-4 w-4" />
                                                </span>
                                                <span>Governança</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Governança"
                                            titleTooltip="Regras e processos. Ex.: PR review obrigatório, deploy com aprovação, acesso por papel."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        govForm.resetFields();
                                                        setGovModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Regras de aprovação, processo e acesso."
                                        >
                                            <SearchSortBar
                                                moduleKey="governance"
                                                placeholder="Buscar regras"
                                            />
                                            {filterAndSort(governance, 'governance').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(governance, 'governance')}
                                                    renderItem={(rule) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        govForm.setFieldsValue(rule);
                                                                        setGovModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold">{rule.name}</span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        <Tag color="purple">{rule.scope}</Tag>
                                                                        <Tag color="green">{rule.status}</Tag>
                                                                    </div>
                                                                </div>
                                                                {rule.description && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        {rule.description}
                                                                    </div>
                                                                )}
                                                                {rule.requirements && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Requisitos: {rule.requirements}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiShield} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'nfrs',
                                    label: (
                                        <Tooltip title="Metas não funcionais e qualidade">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiCheckSquare className="h-4 w-4" />
                                                </span>
                                                <span>NFRs</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="NFRs & Qualidade"
                                            titleTooltip="Metas não funcionais. Ex.: 99,9% uptime, p95 < 300ms, LGPD."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        nfrForm.resetFields();
                                                        setNfrModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Metas não-funcionais e qualidade."
                                        >
                                            <SearchSortBar
                                                moduleKey="nfrs"
                                                placeholder="Buscar NFRs"
                                            />
                                            {filterAndSort(nfrs, 'nfrs', 'priority').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(nfrs, 'nfrs', 'priority')}
                                                    renderItem={(nfr) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        nfrForm.setFieldsValue(nfr);
                                                                        setNfrModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                                <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                                                                    <span>{nfr.category}</span>
                                                                    <Tag color="red">{nfr.priority}</Tag>
                                                                </div>
                                                                <div className="mt-1 grid gap-1 text-xs text-gray-700 sm:grid-cols-3">
                                                                    <span>Meta: {nfr.target || '—'}</span>
                                                                    <span>Métrica: {nfr.metric || '—'}</span>
                                                                    <span>Status: {nfr.current_assessment || '—'}</span>
                                                                </div>
                                                                {nfr.rationale && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Racional: {nfr.rationale}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiCheckSquare} />
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'decisions',
                                    label: (
                                        <Tooltip title="Decisões arquiteturais registradas">
                                            <span className="project-tab-label flex items-center gap-2">
                                                <span className="rounded-lg bg-red-500/15 p-2 text-red-600">
                                                    <FiClipboard className="h-4 w-4" />
                                                </span>
                                                <span>Decisões</span>
                                            </span>
                                        </Tooltip>
                                    ),
                                    children: (
                                        <Section
                                            title="Decisões (ADRs)"
                                            titleTooltip="Decisões arquiteturais registradas. Ex.: escolher PostgreSQL, monorepo vs multirepo."
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        decisionForm.resetFields();
                                                        setDecisionModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Registro de decisões arquiteturais."
                                        >
                                            <SearchSortBar
                                                moduleKey="decisions"
                                                placeholder="Buscar decisões"
                                            />
                                            {filterAndSort(decisions, 'decisions').length ? (
                                                <List
                                                    size="small"
                                                    className="project-list project-list-spaced"
                                                    dataSource={filterAndSort(decisions, 'decisions')}
                                                    renderItem={(adr) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        decisionForm.setFieldsValue(adr);
                                                                        setDecisionModal(true);
                                                                    }}
                                                                >
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                        Editar
                                                                    </span>
                                                                </PrimaryButton>,
                                                            ]}
                                                        >
                                                            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                                <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                                                                    <span className="line-clamp-1">{adr.title}</span>
                                                                    <Tag color="purple">{adr.status}</Tag>
                                                                </div>
                                                                <p className="text-sm text-gray-700">
                                                                    {adr.decision || adr.context || 'Sem conteúdo.'}
                                                                </p>
                                                                {adr.consequences && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        Consequências: {adr.consequences}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <EmptyState icon={FiClipboard} />
                                            )}
                                        </Section>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>

            <Modal
                open={editingOverview}
                onCancel={() => setEditingOverview(false)}
                footer={null}
                title={
                    <span className="text-xl font-semibold text-gray-900">
                        Editar informações do projeto
                    </span>
                }
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={overviewForm}
                    className="flex flex-col"
                    initialValues={{
                        overview: toPlainText(project.overview),
                        purpose: toPlainText(project.purpose),
                        scope: toPlainText(project.scope),
                        target_users: toPlainText(project.target_users),
                    }}
                    onFinish={(values) => {
                        updateProject(values);
                        setEditingOverview(false);
                    }}
                >
                    <Form.Item label="Sobre" name="overview">
                        <TextArea rows={5} className="resize-none" />
                    </Form.Item>
                    <Form.Item label="Propósito" name="purpose">
                        <TextArea rows={3} className="resize-none" />
                    </Form.Item>
                    <Form.Item label="Escopo" name="scope">
                        <TextArea rows={4} className="resize-none" />
                    </Form.Item>
                    <Form.Item label="Público-alvo" name="target_users">
                        <Input className="h-11" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setEditingOverview(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton variant="red" type="submit" loading={loading}>
                            Salvar
                        </PrimaryButton>
                    </div>
                </Form>
            </Modal>

            <Modal
                open={stackModal}
                onCancel={() => setStackModal(false)}
                footer={null}
                title={editingStack ? 'Editar stack' : 'Adicionar stack'}
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={stackForm}
                    className="flex flex-col"
                    onFinish={handleStackSave}
                >
                    <Form.Item label="Categoria" name="category" rules={[{ required: true }]}>
                        <Select
                            placeholder="Selecione"
                            options={[
                                { label: 'Linguagem', value: 'language' },
                                { label: 'Framework', value: 'framework' },
                                { label: 'Biblioteca', value: 'library' },
                                { label: 'Banco de dados', value: 'database' },
                                { label: 'Infraestrutura', value: 'infrastructure' },
                                { label: 'DevOps', value: 'devops' },
                                { label: 'Observabilidade', value: 'observability' },
                                { label: 'Testes', value: 'testing' },
                                { label: 'Segurança', value: 'security' },
                                { label: 'Outro', value: 'other' },
                            ]}
                        />
                    </Form.Item>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Versão" name="version">
                            <Input />
                        </Form.Item>
                    </div>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Racional"
                                tooltip="Por que essa escolha faz sentido para o projeto."
                            />
                        }
                        name="rationale"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Link do fornecedor"
                                tooltip="Site oficial, documentação ou repositório."
                            />
                        }
                        name="vendor_url"
                    >
                        <Input />
                    </Form.Item>
                <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                    <Select
                        options={[
                            { label: 'Selecionada', value: 'chosen' },
                            { label: 'Avaliando', value: 'evaluating' },
                            { label: 'Depreciada', value: 'deprecated' },
                        ]}
                    />
                </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Restrições/Notas"
                                tooltip="Limitações, pré-requisitos ou observações relevantes."
                            />
                        }
                        name="constraints"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => {
                                setStackModal(false);
                                setEditingStack(null);
                            }}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={patternModal}
                onCancel={() => setPatternModal(false)}
                footer={null}
                title="Adicionar padrão de arquitetura"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={patternForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.patterns.store', patternForm, () => setPatternModal(false))}
                >
                    <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Racional"
                                tooltip="Motivo da escolha e benefícios esperados."
                            />
                        }
                        name="rationale"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Referências"
                                tooltip="Links, artigos ou documentação relacionados."
                            />
                        }
                        name="references"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                    <Select
                        options={[
                            { label: 'Adotado', value: 'adopted' },
                            { label: 'Avaliando', value: 'evaluating' },
                            { label: 'Depreciado', value: 'deprecated' },
                        ]}
                    />
                </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Restrições/Notas"
                                tooltip="Limitações, riscos ou dependências conhecidas."
                            />
                        }
                        name="constraints"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setPatternModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={riskModal}
                onCancel={() => setRiskModal(false)}
                footer={null}
                title="Adicionar risco"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={riskForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.risks.store', riskForm, () => setRiskModal(false))}
                >
                    <Form.Item label="Título" name="title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Severidade"
                                tooltip="Impacto do risco no projeto."
                            />
                        }
                        name="severity"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: 'Baixa', value: 'low' },
                                { label: 'Média', value: 'medium' },
                                { label: 'Alta', value: 'high' },
                                { label: 'Crítica', value: 'critical' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Probabilidade" name="likelihood" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { label: 'Baixa', value: 'low' },
                                { label: 'Média', value: 'medium' },
                                { label: 'Alta', value: 'high' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Área de impacto"
                                tooltip="Área do projeto mais afetada pelo risco."
                            />
                        }
                        name="impact_area"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Responsável"
                                tooltip="Pessoa ou time responsável por acompanhar o risco."
                            />
                        }
                        name="owner"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Mitigação"
                                tooltip="Plano ou ação para reduzir o risco."
                            />
                        }
                        name="mitigation"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setRiskModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={integrationModal}
                onCancel={() => setIntegrationModal(false)}
                footer={null}
                title="Adicionar integração"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={integrationForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.integrations.store', integrationForm, () => setIntegrationModal(false))}
                >
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Tipo"
                                tooltip="Categoria da integração (ex.: repo, doc, issue)."
                            />
                        }
                        name="type"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="repo, issue, pr, doc" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Rótulo"
                                tooltip="Nome amigável para a integração."
                            />
                        }
                        name="label"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="URL" name="url" rules={[{ required: true, type: 'url' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Notas" name="notes">
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setIntegrationModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={govModal}
                onCancel={() => setGovModal(false)}
                footer={null}
                title="Adicionar regra de governança"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={govForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.governance.store', govForm, () => setGovModal(false))}
                >
                    <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Escopo"
                                tooltip="Onde a regra se aplica."
                            />
                        }
                        name="scope"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: 'Decisão', value: 'decision' },
                                { label: 'Processo', value: 'process' },
                                { label: 'Acesso', value: 'access' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { label: 'Ativa', value: 'active' },
                                { label: 'Inativa', value: 'inactive' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Descrição" name="description">
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Requisitos"
                                tooltip="Condições necessárias para cumprir a regra."
                            />
                        }
                        name="requirements"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setGovModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={nfrModal}
                onCancel={() => setNfrModal(false)}
                footer={null}
                title="Adicionar NFR"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={nfrForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.nfrs.store', nfrForm, () => setNfrModal(false))}
                >
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Categoria"
                                tooltip="Tipo do requisito não funcional."
                            />
                        }
                        name="category"
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="Selecione"
                            options={[
                                { label: 'Performance', value: 'performance' },
                                { label: 'Segurança', value: 'security' },
                                { label: 'Escalabilidade', value: 'scalability' },
                                { label: 'Disponibilidade', value: 'availability' },
                                { label: 'Confiabilidade', value: 'reliability' },
                                { label: 'Observabilidade', value: 'observability' },
                                { label: 'Usabilidade', value: 'usability' },
                                { label: 'Compliance', value: 'compliance' },
                                { label: 'Outro', value: 'other' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Métrica"
                                tooltip="Como a meta será medida."
                            />
                        }
                        name="metric"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Meta"
                                tooltip="Valor-alvo da métrica."
                            />
                        }
                        name="target"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="Prioridade" name="priority" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { label: 'Alta', value: 'high' },
                                { label: 'Média', value: 'medium' },
                                { label: 'Baixa', value: 'low' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Racional"
                                tooltip="Justificativa do requisito."
                            />
                        }
                        name="rationale"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Avaliação atual"
                                tooltip="Como está hoje frente à meta."
                            />
                        }
                        name="current_assessment"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setNfrModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>

            <Modal
                open={decisionModal}
                onCancel={() => setDecisionModal(false)}
                footer={null}
                title="Adicionar decisão (ADR)"
                width="60%"
                centered
                destroyOnClose
                className="project-edit-modal"
            >
                <Form
                    layout="vertical"
                    form={decisionForm}
                    className="flex flex-col"
                    onFinish={() => handleAdd('projects.decisions.store', decisionForm, () => setDecisionModal(false))}
                >
                    <Form.Item label="Título" name="title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { label: 'Proposta', value: 'proposed' },
                                { label: 'Aceita', value: 'accepted' },
                                { label: 'Substituída', value: 'superseded' },
                                { label: 'Rejeitada', value: 'rejected' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Contexto"
                                tooltip="Cenário que motivou a decisão."
                            />
                        }
                        name="context"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item label="Decisão" name="decision">
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <Form.Item
                        label={
                            <InfoLabel
                                text="Consequências"
                                tooltip="Impactos e trade-offs esperados."
                            />
                        }
                        name="consequences"
                    >
                        <TextArea rows={2} className="resize-none" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setDecisionModal(false)}
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            type="submit"
                            className="!text-white"
                            loading={loading}
                        >
                            Salvar
                        </PrimaryButton>
                    </div>
            </Form>
        </Modal>
            </AuthenticatedLayout>

        <Modal
            open={aiChatOpen}
            onCancel={() => setAiChatOpen(false)}
            footer={null}
            title="Safio Creator AI"
            width={560}
            centered
            destroyOnClose
        >
            <div className="flex h-[520px] flex-col gap-3">
                <div
                    ref={aiChatRef}
                    className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4"
                >
                    {aiMessages.length === 0 && !aiLoading && (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                            Faça perguntas sobre o projeto e receba sugestões rápidas.
                        </div>
                    )}
                    {aiMessages.map((item, index) => (
                        <div
                            key={`${item.role}-${index}`}
                            className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                    item.role === 'user'
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-surface-2)] text-[var(--color-dark)]'
                                }`}
                            >
                                {item.content}
                            </div>
                        </div>
                    ))}
                    {aiLoading && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl bg-[var(--color-surface-2)] px-4 py-3 text-sm text-gray-500">
                                Digitando...
                            </div>
                        </div>
                    )}
                </div>
                {aiError && (
                    <p className="text-xs text-red-500">{aiError}</p>
                )}
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendAiMessage();
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={aiInput}
                        onChange={(event) => setAiInput(event.target.value)}
                        placeholder="Pergunte algo sobre o projeto..."
                        disabled={aiLoading}
                    />
                    <PrimaryButton
                        variant="red"
                        type="submit"
                        className="!text-white"
                        loading={aiLoading}
                    >
                        Enviar
                    </PrimaryButton>
                </form>
            </div>
        </Modal>

            <Modal
                open={aiConfigOpen}
                onCancel={() => setAiConfigOpen(false)}
                footer={null}
                title="Contexto da IA"
                width={520}
                centered
                destroyOnClose
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Defina o que a IA pode usar como contexto ao conversar
                        sobre este projeto.
                    </p>
                <div className="ai-context-grid grid gap-3 sm:grid-cols-2">
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.overview}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    overview: e.target.checked,
                                }))
                            }
                        >
                            Resumo
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.purpose}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    purpose: e.target.checked,
                                }))
                            }
                        >
                            Missão/Propósito
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.scope}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    scope: e.target.checked,
                                }))
                            }
                        >
                            Escopo
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.targetUsers}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    targetUsers: e.target.checked,
                                }))
                            }
                        >
                            Público-alvo
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.stack}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    stack: e.target.checked,
                                }))
                            }
                        >
                            Stack técnica
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.patterns}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    patterns: e.target.checked,
                                }))
                            }
                        >
                            Padrões
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.risks}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    risks: e.target.checked,
                                }))
                            }
                        >
                            Riscos
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.integrations}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    integrations: e.target.checked,
                                }))
                            }
                        >
                            Integrações
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.governance}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    governance: e.target.checked,
                                }))
                            }
                        >
                            Governança
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.nfrs}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    nfrs: e.target.checked,
                                }))
                            }
                        >
                            NFRs
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.decisions}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    decisions: e.target.checked,
                                }))
                            }
                        >
                            Decisões
                        </Checkbox>
                    </div>
                    <div className="ai-context-option">
                        <Checkbox
                            checked={aiContext.chatHistory}
                            onChange={(e) =>
                                setAiContext((prev) => ({
                                    ...prev,
                                    chatHistory: e.target.checked,
                                }))
                            }
                        >
                            Chat inicial do projeto
                        </Checkbox>
                    </div>
                </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <PrimaryButton
                            variant="outlineRed"
                            onClick={() => setAiConfigOpen(false)}
                        >
                            Fechar
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </>
    );
}
