import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Card } from 'antd';

export default function Index({ projects = [] }) {
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

    return (
        <AuthenticatedLayout>
            <Head title="Projetos" />

            <div className="py-8">
                <div className="mx-auto max-w-[70%] px-4">
                    <Card title="Projetos" className="shadow-md">
                        {projects.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                Nenhum projeto ainda.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {projects.map((project) => (
                                    <div
                                        key={project.uuid || project.id}
                                        className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition hover:border-[var(--color-secondary)]/30 hover:shadow-md"
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
                                        <div className="min-w-0">
                                            <div className="line-clamp-1 text-[var(--color-dark)]">
                                                {project.name}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatRelativeTime(project.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
