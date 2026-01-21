import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const TYPED_PHRASES = [
    'Organize decisões técnicas com foco no resultado do negócio.',
    'Reduza ruído, aumente clareza e acelere a execução.',
    'Registre o porquê das escolhas e evite retrabalho caro.',
];

export default function Landing({ canLogin, canRegister }) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = TYPED_PHRASES[phraseIndex];

        if (!isDeleting && typedText === current) {
            const pause = setTimeout(() => setIsDeleting(true), 1100);
            return () => clearTimeout(pause);
        }

        if (isDeleting && typedText === '') {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % TYPED_PHRASES.length);
            return undefined;
        }

        const timeout = setTimeout(() => {
            const nextLength = typedText.length + (isDeleting ? -1 : 1);
            setTypedText(current.slice(0, nextLength));
        }, isDeleting ? 22 : 46);

        return () => clearTimeout(timeout);
    }, [phraseIndex, typedText, isDeleting]);

    return (
        <div className="relative min-h-screen bg-[var(--color-surface)] text-[var(--color-dark)]">
            <Head title="Safio" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#EDE9FE,transparent_60%),radial-gradient(circle_at_bottom,#F5EFFF,transparent_55%)]" />

            <header className="border-b border-[var(--color-secondary)]/10">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[var(--color-secondary)]/10">
                            <span className="h-3 w-3 rounded-full bg-[var(--color-primary)]" />
                        </div>
                        <div>
                            <p className="font-display text-lg font-semibold">SAFIO</p>
                            <p className="font-display text-xs text-gray-500">
                                Decisões técnicas com visão de mercado.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="font-display rounded-lg border border-[var(--color-secondary)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                            >
                                Entrar
                            </Link>
                        )}
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="font-display rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                            >
                                Criar conta
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
                <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
                    <div className="fade-up fade-up-delay-1 space-y-5">
                        <div className="font-display inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary)]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-dark)]">
                            Plataforma de decisões técnicas
                        </div>
                        <h1 className="font-display text-4xl font-semibold text-[var(--color-dark)] sm:text-5xl">
                            Decisões técnicas que viram vantagem competitiva.
                        </h1>
                        <p className="text-base text-gray-600">
                            O Safio organiza o “porquê” de cada escolha de
                            arquitetura, stack e risco. Menos retrabalho, mais clareza
                            para times e liderança.
                        </p>
                        <div
                            className="font-display min-h-[28px] text-sm text-[var(--color-secondary)]"
                            aria-live="polite"
                        >
                            {typedText}
                            <span className="ml-1 animate-pulse text-[var(--color-primary)]">
                                |
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="font-display rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                                >
                                    Criar minha conta
                                </Link>
                            )}
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="font-display rounded-lg border border-[var(--color-secondary)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                                >
                                    Acessar o sistema
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="fade-up fade-up-delay-2 rounded-2xl border border-[var(--color-secondary)]/10 bg-white p-6 shadow-xl">
                        <h2 className="font-display text-lg font-semibold text-[var(--color-dark)]">
                            O que sua equipe ganha
                        </h2>
                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                            {[
                                'Contexto compartilhado para reduzir dependência de pessoas-chave.',
                                'Decisões registradas com racional, riscos e impacto real no negócio.',
                                'Visão clara do que foi escolhido e do que foi descartado.',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-xl border border-[var(--color-secondary)]/10 bg-[var(--color-surface-2)]/40 px-4 py-3 transition hover:-translate-y-1 hover:border-[var(--color-secondary)]/40 hover:bg-white hover:shadow-md"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            title: 'Propósito e escopo',
                            text: 'Defina o que o produto resolve, para quem e até onde vai.',
                        },
                        {
                            title: 'Stack e padrões',
                            text: 'Registre tecnologia e arquitetura com contexto de escolha.',
                        },
                        {
                            title: 'Decisões e trade-offs',
                            text: 'Deixe claro o que foi aceito, o que ficou pendente e por quê.',
                        },
                        {
                            title: 'NFRs e qualidade',
                            text: 'Guarde metas de performance, segurança e escalabilidade.',
                        },
                        {
                            title: 'Riscos e mitigação',
                            text: 'Antecipe problemas e alinhe ações com o time.',
                        },
                        {
                            title: 'Governança e integrações',
                            text: 'Centralize regras, processos e links críticos do projeto.',
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="fade-up fade-up-delay-3 rounded-xl border border-[var(--color-secondary)]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-secondary)]/40 hover:shadow-lg"
                        >
                            <h3 className="font-display text-sm font-semibold text-[var(--color-dark)]">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">{item.text}</p>
                        </div>
                    ))}
                </section>

                <section className="fade-up grid gap-6 rounded-2xl border border-[var(--color-secondary)]/10 bg-white p-8 shadow-sm lg:grid-cols-[1.1fr,0.9fr]">
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-[var(--color-dark)]">
                            Para equipes que precisam de previsibilidade técnica.
                        </h2>
                        <p className="mt-3 text-sm text-gray-600">
                            Ideal para tech leads, startups e consultorias que precisam
                            preservar conhecimento, reduzir dívida técnica e justificar
                            escolhas com visão de mercado.
                        </p>
                    </div>
                    <div className="grid gap-3 text-sm text-gray-600">
                        {[
                            'Onboarding mais rápido com contexto estruturado.',
                            'Menos retrabalho ao revisar decisões antigas.',
                            'Clareza para negociar prazos e investimentos.',
                        ].map((item) => (
                            <div
                                key={item}
                                className="rounded-xl border border-[var(--color-secondary)]/10 bg-[var(--color-surface-2)]/40 px-4 py-3 transition hover:-translate-y-1 hover:border-[var(--color-secondary)]/40 hover:bg-white hover:shadow-md"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="fade-up flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--color-secondary)]/10 bg-[var(--color-secondary)]/5 p-8 shadow-sm md:flex-row md:items-center">
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-[var(--color-dark)]">
                            Traga previsibilidade para suas decisões.
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Comece agora e documente o que realmente mantém o projeto saudável.
                        </p>
                    </div>
                    {canRegister && (
                        <Link
                            href={route('register')}
                            className="font-display rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                        >
                            Começar agora
                        </Link>
                    )}
                </section>
            </main>
        </div>
    );
}
