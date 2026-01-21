import { TERMS_SECTIONS } from '@/Content/legalContent';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Terms() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-display text-xl font-semibold leading-tight text-gray-800">
                    Termos de Uso
                </h2>
            }
        >
            <Head title="Termos de Uso" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end">
                        <Link
                            href={route('profile.edit')}
                            className="font-display rounded-lg border border-[var(--color-secondary)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                        >
                            Voltar para o perfil
                        </Link>
                    </div>

                    {TERMS_SECTIONS.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <h3 className="font-display text-lg font-semibold text-gray-900">
                                {section.title}
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-gray-700">
                                {section.body}
                            </p>
                        </section>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
