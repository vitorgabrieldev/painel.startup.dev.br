import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Select, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { FiArrowDown, FiArrowUp, FiClock, FiSearch, FiUsers } from 'react-icons/fi';

export default function Index({ projects = [] }) {
    const SEARCH_HISTORY_KEY = 'projects.search.history';
    const [searchTags, setSearchTags] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchHistory, setSearchHistory] = useState([]);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [visibleProjects, setVisibleProjects] = useState(projects);
    const [searching, setSearching] = useState(false);
    const [searchTick, setSearchTick] = useState(0);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setSearchHistory(parsed.filter(Boolean));
                }
            }
        } catch (error) {
            setSearchHistory([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                SEARCH_HISTORY_KEY,
                JSON.stringify(searchHistory.slice(0, 12)),
            );
        } catch (error) {
            // ignore write errors (private mode)
        }
    }, [searchHistory]);

    const normalizeText = (value) =>
        String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const flattenValue = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value !== 'string') return String(value);
        const trimmed = value.trim();
        if (!trimmed) return '';
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') return parsed;
            if (Array.isArray(parsed)) return parsed.join(' ');
            if (typeof parsed === 'object') {
                return Object.values(parsed).flat().join(' ');
            }
        } catch (error) {
            return value;
        }
        return value;
    };

    const getProjectSearchText = (project) =>
        normalizeText(
            [
                project.name,
                flattenValue(project.overview),
                flattenValue(project.purpose),
                flattenValue(project.scope),
                flattenValue(project.target_users),
            ]
                .filter(Boolean)
                .join(' '),
        );

    const filteredAndSorted = useMemo(() => {
        const activeTags = searchTags
            .map((tag) => normalizeText(tag.trim()))
            .filter((tag) => tag.length >= 3);

        const filtered = activeTags.length
            ? projects.filter((project) => {
                  const haystack = getProjectSearchText(project);
                  return activeTags.every((tag) => haystack.includes(tag));
              })
            : projects;

        const direction = sortDirection === 'asc' ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === 'name') {
                return (
                    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) *
                    direction
                );
            }
            const aDate = new Date(a[sortBy] || 0).getTime();
            const bDate = new Date(b[sortBy] || 0).getTime();
            return (aDate - bDate) * direction;
        });

        return sorted;
    }, [projects, searchTags, sortBy, sortDirection]);

    useEffect(() => {
        let canceled = false;
        setSearching(true);
        const handle = setTimeout(() => {
            if (canceled) return;
            setVisibleProjects(filteredAndSorted);
            setSearching(false);
        }, 220);
        return () => {
            canceled = true;
            clearTimeout(handle);
        };
    }, [filteredAndSorted, searchTick]);

    useEffect(() => {
        setVisibleProjects(projects);
    }, [projects]);

    const registerHistory = (tags) => {
        const unique = tags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length >= 3);
        if (!unique.length) return;
        setSearchHistory((prev) => {
            const next = [...unique, ...prev].filter(Boolean);
            return [...new Set(next)].slice(0, 12);
        });
    };

    const handleTagsChange = (value) => {
        setSearchTags(value);
        registerHistory(value);
    };

    const handleSearchNow = () => {
        setSearchTick((prev) => prev + 1);
        if (searchTags.length) {
            registerHistory(searchTags);
        }
    };

    const formatRelativeTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        if (seconds < 60) return 'agora';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minuto${minutes === 1 ? '' : 's'} atrás`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hora${hours === 1 ? '' : 's'} atrás`;
        }

        const days = Math.floor(hours / 24);
        if (days < 7) {
            return `${days} dia${days === 1 ? '' : 's'} atrás`;
        }

        const weeks = Math.floor(days / 7);
        if (weeks < 5) {
            return `${weeks} semana${weeks === 1 ? '' : 's'} atrás`;
        }

        const months = Math.floor(days / 30);
        if (months < 12) {
            return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`;
        }

        const years = Math.floor(days / 365);
        return `${years} ano${years === 1 ? '' : 's'} atrás`;
    };

    const sortOptions = [
        { label: 'Título', value: 'name' },
        { label: 'Data de criação', value: 'created_at' },
        { label: 'Última modificação', value: 'updated_at' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Projetos" />

            <div className="py-8">
                <div className="mx-auto max-w-[70%] px-4">
                    <Card title="Projetos" className="shadow-md">
                        <div className="mb-5 flex flex-wrap items-center gap-3">
                            <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-[6px] border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                <Tooltip title="Histórico de busca">
                                    <button
                                        type="button"
                                        onClick={() => setSearchTick((prev) => prev + 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 text-gray-500 transition hover:text-[var(--color-secondary)]"
                                    >
                                        <FiClock className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                                <Select
                                    mode="tags"
                                    value={searchTags}
                                    options={searchHistory.map((item) => ({
                                        value: item,
                                        label: item,
                                    }))}
                                    placeholder="Buscar por título, descrição, público-alvo..."
                                    className="flex-1"
                                    variant="borderless"
                                    suffixIcon={null}
                                    onSearch={(value) => setSearchInput(value)}
                                    onChange={handleTagsChange}
                                    onInputKeyDown={(event) => {
                                        if (event.key === 'Enter' && searchInput.trim().length === 0) {
                                            event.preventDefault();
                                            handleSearchNow();
                                        }
                                    }}
                                    maxTagCount="responsive"
                                />
                                <Button
                                    type="text"
                                    onClick={handleSearchNow}
                                    className="flex h-8 w-8 items-center justify-center"
                                    icon={<FiSearch />}
                                />
                            </div>

                            <div className="flex items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-2 py-2 shadow-sm">
                                <Select
                                    value={sortBy}
                                    options={sortOptions}
                                    onChange={setSortBy}
                                    className="min-w-[180px]"
                                    variant="borderless"
                                />
                                <Tooltip
                                    title={
                                        sortDirection === 'asc'
                                            ? 'Ordenação crescente'
                                            : 'Ordenação decrescente'
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSortDirection((prev) =>
                                                prev === 'asc' ? 'desc' : 'asc',
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-600 transition hover:text-[var(--color-secondary)]"
                                    >
                                        {sortDirection === 'asc' ? (
                                            <FiArrowUp className="h-4 w-4" />
                                        ) : (
                                            <FiArrowDown className="h-4 w-4" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        {projects.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                Nenhum projeto ainda.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {!searching && visibleProjects.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                                        Nenhum resultado com essas tags.
                                    </div>
                                )}
                                {visibleProjects.map((project) => {
                                    const title = project.name || '';
                                    const initial =
                                        title.trim().charAt(0).toUpperCase() || '?';
                                    const avatarUrl = project.avatar_url
                                        ? `${project.avatar_url}?v=${project.updated_at || project.id}`
                                        : null;
                                    const isShared =
                                        project.member_role && project.member_role !== 'owner';
                                    return (
                                    <div
                                        key={project.uuid || project.id}
                                        className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] border border-gray-100 bg-white px-4 py-4 shadow-sm transition hover:border-[var(--color-secondary)]/30 hover:shadow-md"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            router.visit(route('projects.show', project.uuid))
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                router.visit(route('projects.show', project.uuid));
                                            }
                                        }}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[4px] border border-gray-200 bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-dark)]">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={`Avatar do projeto ${title}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{initial}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="line-clamp-1 text-[var(--color-dark)]">
                                                    {project.name}
                                                </div>
                                                {isShared && (
                                                    <span
                                                        className="inline-flex h-7 w-7 p-1 border border-purple-700 items-center justify-center rounded-full bg-purple-100 text-purple-700"
                                                        title="Projeto compartilhado"
                                                    >
                                                        <FiUsers className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatRelativeTime(project.updated_at || project.created_at)}
                                        </span>
                                    </div>
                                );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
