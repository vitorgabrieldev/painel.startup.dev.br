import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import {
    Form,
    Input,
    Modal,
    Select,
    Space,
    message,
    List,
    Tabs,
    Tag,
    Tooltip,
} from 'antd';
import { HiArrowLeft } from 'react-icons/hi';

const { TextArea } = Input;

const Section = ({ title, action, children, subtitle }) => (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        {action}
        </div>
        <div className="text-sm text-gray-700">{children}</div>
    </section>
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

export default function Show({ project: initialProject }) {
    const [project, setProject] = useState(initialProject);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const [editingOverview, setEditingOverview] = useState(false);
    const [overviewForm] = Form.useForm();

    const [stackModal, setStackModal] = useState(false);
    const [stackForm] = Form.useForm();

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
    const [searchFilters, setSearchFilters] = useState({
        stack: '',
        patterns: '',
        risks: '',
        integrations: '',
        governance: '',
        nfrs: '',
        decisions: '',
    });
    const [statusFilters, setStatusFilters] = useState({
        stack: '',
        patterns: '',
        governance: '',
        nfrs: '',
        decisions: '',
    });

    useEffect(() => {
        setProject(initialProject);
        overviewForm.setFieldsValue({
            overview: initialProject.overview,
            purpose: initialProject.purpose,
            scope: initialProject.scope,
            target_users: initialProject.target_users,
        });
    }, [initialProject, overviewForm]);

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

    const filterList = (list, key = 'name', moduleKey = '', statusKey = 'status') =>
        list.filter((item) => {
            const text = (item[key] || item.title || '').toLowerCase();
            const searchTerm = (searchFilters[moduleKey] || '').toLowerCase();
            const match = text.includes(searchTerm);
            const statusFilter = statusFilters[moduleKey] || '';
            const statusValue = (item[statusKey] || '').toLowerCase();
            const statusMatch = statusFilter ? statusValue === statusFilter.toLowerCase() : true;
            return match && statusMatch;
        });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-900">
                        {project.name}
                    </h2>
                </div>
            }
        >
            {contextHolder}
            <Head title={project.name} />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <Link href={route('dashboard')}>
                            <PrimaryButton variant="red" className="!text-white">
                                <HiArrowLeft className="mr-2" /> Voltar para dashboard
                            </PrimaryButton>
                        </Link>
                        <Tooltip title="Status atual do projeto">
                            <Tag color="green">{statusLabel(project.status)}</Tag>
                        </Tooltip>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Tabs
                            tabPosition="left"
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                {
                                    key: 'overview',
                                    label: 'Sobre/Escopo',
                                    children: (
                                        <Section
                                            title="Sobre, propósito e escopo"
                                            action={
                                                <PrimaryButton
                                                    variant="outlineRed"
                                                    className="!text-[var(--color-primary)]"
                                                    onClick={() => setEditingOverview(true)}
                                                >
                                                    Editar
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
                                    label: 'Stack técnica',
                                    children: (
                                        <Section
                                            title="Stack técnica"
                                            action={
                                                <PrimaryButton
                                                    variant="red"
                                                    className="!text-white"
                                                    onClick={() => {
                                                        stackForm.resetFields();
                                                        setStackModal(true);
                                                    }}
                                                >
                                                    Adicionar
                                                </PrimaryButton>
                                            }
                                            subtitle="Linguagens, frameworks, bancos, infra e ferramentas."
                                        >
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar stack..."
                                                    className="max-w-xs"
                                                    value={searchFilters.stack}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            stack: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Select
                                                    allowClear
                                                    placeholder="Status"
                                                    className="w-40"
                                                    value={statusFilters.stack || undefined}
                                                    onChange={(v) =>
                                                        setStatusFilters((prev) => ({
                                                            ...prev,
                                                            stack: v || '',
                                                        }))
                                                    }
                                                    options={[
                                                        { label: 'Selecionada', value: 'chosen' },
                                                        { label: 'Avaliando', value: 'evaluating' },
                                                        { label: 'Depreciada', value: 'deprecated' },
                                                    ]}
                                                />
                                            </div>
                                            {filterList(stacks, 'name', 'stack').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(stacks, 'name', 'stack')}
                                                    renderItem={(item) => (
                                                        <List.Item
                                                            className="!w-full p-0"
                                                            actions={[
                                                                <PrimaryButton
                                                                    key="edit"
                                                                    variant="outlineRed"
                                                                    className="!px-3 !py-1"
                                                                    onClick={() => {
                                                                        stackForm.setFieldsValue(item);
                                                                        setStackModal(true);
                                                                    }}
                                                                >
                                                                    Editar
                                                                </PrimaryButton>,
                                                            ]}
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
                                                                    <div className="flex justify-end">
                                                                        <Tag color="red">{item.status || '—'}</Tag>
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
                                                <p>Sem itens de stack.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'patterns',
                                    label: 'Padrões',
                                    children: (
                                        <Section
                                            title="Padrões de arquitetura"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar padrão..."
                                                    className="max-w-xs"
                                                    value={searchFilters.patterns}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            patterns: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Select
                                                    allowClear
                                                    placeholder="Status"
                                                    className="w-40"
                                                    value={statusFilters.patterns || undefined}
                                                    onChange={(v) =>
                                                        setStatusFilters((prev) => ({
                                                            ...prev,
                                                            patterns: v || '',
                                                        }))
                                                    }
                                                    options={[
                                                        { label: 'Adotado', value: 'adopted' },
                                                        { label: 'Avaliando', value: 'evaluating' },
                                                        { label: 'Depreciado', value: 'deprecated' },
                                                    ]}
                                                />
                                            </div>
                                            {filterList(patterns, 'name', 'patterns').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(patterns, 'name', 'patterns')}
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
                                                                    Editar
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
                                                <p>Sem padrões cadastrados.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'risks',
                                    label: 'Riscos',
                                    children: (
                                        <Section
                                            title="Riscos"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar risco..."
                                                    className="max-w-xs"
                                                    value={searchFilters.risks}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            risks: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            {filterList(risks, 'title', 'risks').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(risks, 'title', 'risks')}
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
                                                                    Editar
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
                                                <p>Sem riscos listados.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'integrations',
                                    label: 'Integrações',
                                    children: (
                                        <Section
                                            title="Integrações"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar integração..."
                                                    className="max-w-xs"
                                                    value={searchFilters.integrations}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            integrations: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            {filterList(integrations, 'label', 'integrations').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(integrations, 'label', 'integrations')}
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
                                                                    Editar
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
                                                <p>Sem integrações.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'governance',
                                    label: 'Governança',
                                    children: (
                                        <Section
                                            title="Governança"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar regra..."
                                                    className="max-w-xs"
                                                    value={searchFilters.governance}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            governance: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Select
                                                    allowClear
                                                    placeholder="Status"
                                                    className="w-40"
                                                    value={statusFilters.governance || undefined}
                                                    onChange={(v) =>
                                                        setStatusFilters((prev) => ({
                                                            ...prev,
                                                            governance: v || '',
                                                        }))
                                                    }
                                                    options={[
                                                        { label: 'Ativa', value: 'active' },
                                                        { label: 'Inativa', value: 'inactive' },
                                                    ]}
                                                />
                                            </div>
                                            {filterList(governance, 'name', 'governance').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(governance, 'name', 'governance')}
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
                                                                    Editar
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
                                                <p>Sem regras definidas.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'nfrs',
                                    label: 'NFRs',
                                    children: (
                                        <Section
                                            title="NFRs & Qualidade"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar NFR..."
                                                    className="max-w-xs"
                                                    value={searchFilters.nfrs}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            nfrs: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Select
                                                    allowClear
                                                    placeholder="Prioridade"
                                                    className="w-40"
                                                    value={statusFilters.nfrs || undefined}
                                                    onChange={(v) =>
                                                        setStatusFilters((prev) => ({
                                                            ...prev,
                                                            nfrs: v || '',
                                                        }))
                                                    }
                                                    options={[
                                                        { label: 'Alta', value: 'high' },
                                                        { label: 'Média', value: 'medium' },
                                                        { label: 'Baixa', value: 'low' },
                                                    ]}
                                                />
                                            </div>
                                            {filterList(nfrs, 'category', 'nfrs', 'priority').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(nfrs, 'category', 'nfrs', 'priority')}
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
                                                                    Editar
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
                                                <p>Sem NFRs registradas.</p>
                                            )}
                                        </Section>
                                    ),
                                },
                                {
                                    key: 'decisions',
                                    label: 'Decisões',
                                    children: (
                                        <Section
                                            title="Decisões (ADRs)"
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
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <Input.Search
                                                    allowClear
                                                    placeholder="Buscar decisão..."
                                                    className="max-w-xs"
                                                    value={searchFilters.decisions}
                                                    onChange={(e) =>
                                                        setSearchFilters((prev) => ({
                                                            ...prev,
                                                            decisions: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Select
                                                    allowClear
                                                    placeholder="Status"
                                                    className="w-40"
                                                    value={statusFilters.decisions || undefined}
                                                    onChange={(v) =>
                                                        setStatusFilters((prev) => ({
                                                            ...prev,
                                                            decisions: v || '',
                                                        }))
                                                    }
                                                    options={[
                                                        { label: 'Proposta', value: 'proposed' },
                                                        { label: 'Aceita', value: 'accepted' },
                                                        { label: 'Substituída', value: 'superseded' },
                                                        { label: 'Rejeitada', value: 'rejected' },
                                                    ]}
                                                />
                                            </div>
                                            {filterList(decisions, 'title', 'decisions').length ? (
                                                <List
                                                    size="small"
                                                    dataSource={filterList(decisions, 'title', 'decisions')}
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
                                                                    Editar
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
                                                <p>Sem ADRs ainda.</p>
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
                title="Editar informações do projeto"
                centered
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    form={overviewForm}
                    initialValues={{
                        overview: project.overview,
                        purpose: project.purpose,
                        scope: project.scope,
                        target_users: project.target_users,
                    }}
                    onFinish={(values) => {
                        updateProject(values);
                        setEditingOverview(false);
                    }}
                >
                    <Form.Item label="Sobre" name="overview">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="Propósito" name="purpose">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Escopo" name="scope">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Público-alvo" name="target_users">
                        <Input />
                    </Form.Item>
                    <Space>
                        <PrimaryButton variant="green" type="submit" loading={loading}>
                            Salvar
                        </PrimaryButton>
                        <PrimaryButton
                            variant="red"
                            onClick={() => setEditingOverview(false)}
                            loading={loading}
                        >
                            Cancelar
                        </PrimaryButton>
                    </Space>
                </Form>
            </Modal>

            <Modal
                open={stackModal}
                onCancel={() => setStackModal(false)}
                footer={null}
                title="Adicionar stack"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={stackForm} onFinish={() => handleAdd('projects.stack.store', stackForm, () => setStackModal(false))}>
                    <Form.Item label="Categoria" name="category" rules={[{ required: true }]}>
                        <Input placeholder="ex: language, framework, database" />
                    </Form.Item>
                    <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Versão" name="version">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Racional" name="rationale">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Link do fornecedor" name="vendor_url">
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
                    <Form.Item label="Restrições/Notas" name="constraints">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={patternModal}
                onCancel={() => setPatternModal(false)}
                footer={null}
                title="Adicionar padrão de arquitetura"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={patternForm} onFinish={() => handleAdd('projects.patterns.store', patternForm, () => setPatternModal(false))}>
                    <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Racional" name="rationale">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Referências" name="references">
                        <TextArea rows={2} />
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
                    <Form.Item label="Restrições/Notas" name="constraints">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={riskModal}
                onCancel={() => setRiskModal(false)}
                footer={null}
                title="Adicionar risco"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={riskForm} onFinish={() => handleAdd('projects.risks.store', riskForm, () => setRiskModal(false))}>
                    <Form.Item label="Título" name="title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Severidade" name="severity" rules={[{ required: true }]}>
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
                    <Form.Item label="Área de impacto" name="impact_area">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Responsável" name="owner">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Mitigação" name="mitigation">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={integrationModal}
                onCancel={() => setIntegrationModal(false)}
                footer={null}
                title="Adicionar integração"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={integrationForm} onFinish={() => handleAdd('projects.integrations.store', integrationForm, () => setIntegrationModal(false))}>
                    <Form.Item label="Tipo" name="type" rules={[{ required: true }]}>
                        <Input placeholder="repo, issue, pr, doc" />
                    </Form.Item>
                    <Form.Item label="Rótulo" name="label" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="URL" name="url" rules={[{ required: true, type: 'url' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Notas" name="notes">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={govModal}
                onCancel={() => setGovModal(false)}
                footer={null}
                title="Adicionar regra de governança"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={govForm} onFinish={() => handleAdd('projects.governance.store', govForm, () => setGovModal(false))}>
                    <Form.Item label="Nome" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Escopo" name="scope" rules={[{ required: true }]}>
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
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Requisitos" name="requirements">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={nfrModal}
                onCancel={() => setNfrModal(false)}
                footer={null}
                title="Adicionar NFR"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={nfrForm} onFinish={() => handleAdd('projects.nfrs.store', nfrForm, () => setNfrModal(false))}>
                    <Form.Item label="Categoria" name="category" rules={[{ required: true }]}>
                        <Input placeholder="performance, security, scalability..." />
                    </Form.Item>
                    <Form.Item label="Métrica" name="metric">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Meta" name="target">
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
                    <Form.Item label="Racional" name="rationale">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Avaliação atual" name="current_assessment">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>

            <Modal
                open={decisionModal}
                onCancel={() => setDecisionModal(false)}
                footer={null}
                title="Adicionar decisão (ADR)"
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={decisionForm} onFinish={() => handleAdd('projects.decisions.store', decisionForm, () => setDecisionModal(false))}>
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
                    <Form.Item label="Contexto" name="context">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Decisão" name="decision">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="Consequências" name="consequences">
                        <TextArea rows={2} />
                    </Form.Item>
                <PrimaryButton
                    variant="red"
                    type="submit"
                    className="!text-white"
                    loading={loading}
                >
                    Salvar
                </PrimaryButton>
            </Form>
        </Modal>
        </AuthenticatedLayout>
    );
}
