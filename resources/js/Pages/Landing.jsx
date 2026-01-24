import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    FiActivity,
    FiBarChart2,
    FiCheckCircle,
    FiCompass,
    FiFileText,
    FiLayers,
    FiLock,
    FiShield,
    FiTarget,
    FiTrendingUp,
    FiUsers,
} from 'react-icons/fi';

const TYPED_PHRASES = [
    'Documente seu projeto com apoio de IA.',
    'Receba sugestões automáticas de stack e padrões.',
    'Evolua seu código com dicas inteligentes.',
];

const EXEC_SUMMARY = [
    {
        icon: FiBarChart2,
        text: 'Centralize a documentação do seu projeto com sugestões de IA.',
    },
    {
        icon: FiCheckCircle,
        text: 'Receba dicas automáticas de melhorias e padrões de arquitetura.',
    },
    {
        icon: FiLayers,
        text: 'Compartilhe decisões, aprendizados e stacks recomendados.',
    },
];

const RESULTS = [
    {
        icon: FiTrendingUp,
        title: 'Organização inteligente',
        text: 'Tenha tudo do seu projeto em um só lugar, com insights automáticos.',
    },
    {
        icon: FiTarget,
        title: 'Sugestões de stack',
        text: 'Receba recomendações de tecnologias e padrões para seu contexto.',
    },
    {
        icon: FiUsers,
        title: 'Evolução contínua',
        text: 'Registre melhorias e implemente dicas da IA para crescer mais rápido.',
    },
    {
        icon: FiActivity,
        title: 'Agilidade',
        text: 'Documente rápido, sem burocracia, com apoio da inteligência artificial.',
    },
];

const STEPS = [
    {
        icon: FiCompass,
        title: '1. Documente com IA',
        text: 'Registre decisões e ideias com sugestões automáticas.',
    },
    {
        icon: FiCheckCircle,
        title: '2. Receba recomendações',
        text: 'A IA sugere stacks, padrões e melhorias para seu projeto.',
    },
    {
        icon: FiTrendingUp,
        title: '3. Compartilhe e evolua',
        text: 'Implemente dicas, compartilhe e acompanhe a evolução.',
    },
];

const SECURITY = [
    {
        icon: FiShield,
        text: 'Seus dados protegidos e privados.',
    },
    {
        icon: FiLock,
        text: 'Histórico de alterações sempre disponível.',
    },
    {
        icon: FiFileText,
        text: 'Anexe arquivos e mantenha tudo organizado.',
    },
    {
        icon: FiCheckCircle,
        text: 'Exporte informações quando quiser.',
    },
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
        <div
            className="relative min-h-screen bg-[var(--color-surface)] text-[var(--color-dark)]"
            style={{
                '--color-primary': '#f81a42',
                '--color-secondary': '#0f172a',
                '--color-surface': '#0b0f19',
                '--color-surface-2': '#111827',
                '--color-dark': '#f8fafc',
                '--color-accent': '#fbbf24',
            }}
        >
            <Head title="Safio Studio" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2a0b12,transparent_55%),radial-gradient(circle_at_bottom,#0b1220,transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_84px),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_84px)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_14px)]" />

            <header className="border-b border-white/10 bg-black/30 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <Link href="/" className="flex items-center gap-3">
                        <div>
                            <p className="font-display text-lg font-semibold tracking-tight text-white">
                                Safio Studio
                            </p>
                            <p className="text-xs text-slate-400">
                                Documentação inteligente para devs solos, freelancers e startups.
                            </p>
                        </div>
                    </Link>
                    <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                        <a href="#resultados" className="transition hover:text-white">
                            Benefícios
                        </a>
                        <a href="#como-funciona" className="transition hover:text-white">
                            Como funciona
                        </a>
                        <a href="#seguranca" className="transition hover:text-white">
                            Segurança
                        </a>
                        <a href="#cta" className="transition hover:text-white">
                            Assinar
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="font-display rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
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

            <main className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
                <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
                    <div className="fade-up fade-up-delay-1 space-y-6">
                        <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
                            Safio Studio: IA para documentar, sugerir e evoluir seu projeto.
                        </h1>
                        <p className="text-base text-slate-300">
                            Organize ideias, registre decisões, anexe arquivos e receba sugestões automáticas de stack, padrões e melhorias. Tudo em um só lugar, feito para devs solos, freelancers, startups e pequenos times.
                        </p>
                        <div
                            className="font-display min-h-[28px] text-sm text-rose-200"
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
                                    className="font-display rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                                >
                                    Criar conta
                                </Link>
                            )}
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="font-display rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
                                >
                                    Entrar
                                </Link>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            {[
                                'Devs solos',
                                'Freelancers',
                                'Startups',
                                'Pequenos times',
                                'Com IA embarcada',
                            ].map((item) => (
                                <span
                                    key={item}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="fade-up fade-up-delay-2 rounded-2xl border border-white/10 bg-[var(--color-surface-2)]/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                    Resumo executivo
                                </p>
                                <h2 className="font-display mt-2 text-xl font-semibold text-white">
                                    Seu portfólio técnico em linguagem de negócio.
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 text-sm text-slate-300">
                            {EXEC_SUMMARY.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.text}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                                    >
                                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[var(--color-primary)]">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span>{item.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {[
                                { label: 'Onboarding mais rápido', value: '2.4x' },
                                { label: 'Decisões auditáveis', value: '100%' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-4 text-center"
                                >
                                    <p className="font-display text-lg font-semibold text-white">
                                        {stat.value}
                                    </p>
                                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="resultados"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {RESULTS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.title}
                                className="fade-up fade-up-delay-3 rounded-xl border border-white/10 bg-[var(--color-surface-2)]/70 p-5 shadow-sm"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[var(--color-primary)]">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <h3 className="mt-3 font-display text-sm font-semibold text-white">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-300">{item.text}</p>
                            </div>
                        );
                    })}
                </section>

                <section
                    id="como-funciona"
                    className="grid gap-6 rounded-2xl border border-white/10 bg-[var(--color-surface-2)]/70 p-8 shadow-sm lg:grid-cols-[1.1fr,0.9fr]"
                >
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-white">
                            Controle o ciclo de decisões e transforme isso em
                            argumento de venda.
                        </h2>
                        <p className="mt-3 text-sm text-slate-300">
                            Safio Studio consolida dados técnicos e transforma em
                            entregáveis para diretoria, clientes e auditorias. Tudo
                            em um painel único.
                        </p>
                        <div className="mt-6 space-y-3 text-sm text-slate-300">
                            {[
                                'Mapeie escopo, stack, riscos e NFRs por projeto.',
                                'Aprove decisões com stakeholders e registre evidências.',
                                'Compartilhe relatórios com linguagem executiva.',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-4 text-sm text-slate-300">
                        {STEPS.map((step) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.title}
                                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 shadow-sm"
                                >
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[var(--color-primary)]">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <h3 className="mt-3 font-display text-sm font-semibold text-white">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-300">
                                        {step.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section
                    id="seguranca"
                    className="grid gap-6 rounded-2xl border border-white/10 bg-[var(--color-surface-2)]/70 p-8 shadow-sm lg:grid-cols-[0.9fr,1.1fr]"
                >
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Segurança e compliance
                        </p>
                        <h2 className="font-display text-2xl font-semibold text-white">
                            Confie a governança técnica a um fluxo auditável.
                        </h2>
                        <p className="text-sm text-slate-300">
                            Políticas claras, histórico de decisão e acesso por
                            perfil. A base certa para ISO, SOC e auditorias.
                        </p>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                        {SECURITY.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.text}
                                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                                >
                                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[var(--color-primary)]">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span>{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section
                    id="cta"
                    className="fade-up rounded-2xl border border-white/10 bg-[var(--color-primary)]/15 p-8 text-center shadow-sm"
                >
                    <h2 className="font-display text-2xl font-semibold text-white">
                        Pronto para vender confiança técnica?
                    </h2>
                    <p className="mt-3 text-sm text-slate-300">
                        Mostre para clientes e diretorias que as escolhas técnicas
                        do seu time viram previsibilidade e margem.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="font-display rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                            >
                                Criar conta
                            </Link>
                        )}
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="font-display rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
