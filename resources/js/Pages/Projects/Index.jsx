import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, router } from '@inertiajs/react';
import { Card, Tooltip } from 'antd';
import { FiEye } from 'react-icons/fi';

export default function Index({ projects = [] }) {
    const statusLabel = (status) => {
        if (status === 'active') return 'ativo';
        if (status === 'draft') return 'rascunho';
        if (status === 'archived') return 'arquivado';
        return status || '';
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
                            <div className="divide-y divide-gray-100">
                                {projects.map((project) => (
                                    <div
                                        key={project.uuid || project.id}
                                        className="flex items-center justify-between gap-4 py-4"
                                    >
                                        <div className="min-w-0">
                                            <div className="line-clamp-1 text-[var(--color-dark)]">
                                                {project.name}
                                            </div>
                                            <span className="mt-2 inline-flex rounded-full bg-[var(--color-secondary)] px-2 py-1 text-[11px] font-semibold uppercase text-white">
                                                {statusLabel(project.status)}
                                            </span>
                                        </div>
                                        <Tooltip title="Ver detalhes do projeto">
                                            <span>
                                                <PrimaryButton
                                                    variant="outlineRed"
                                                    className="!px-3 !py-1"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                'projects.show',
                                                                project.uuid,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <FiEye className="mr-1" /> Visualizar
                                                </PrimaryButton>
                                            </span>
                                        </Tooltip>
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
