import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '@/Content/legalContent';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FiCreditCard, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { SiGithub, SiGoogle } from 'react-icons/si';

export default function Register() {
    const [activeModal, setActiveModal] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        cpf: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const formatCpf = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        let formatted = '';
        for (let i = 0; i < digits.length; i += 1) {
            if (i === 3 || i === 6) {
                formatted += '.';
            }
            if (i === 9) {
                formatted += '-';
            }
            formatted += digits[i];
        }
        return formatted;
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
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
            <Head title="Criar conta" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2a0b12,transparent_55%),radial-gradient(circle_at_bottom,#0b1220,transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_84px),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_84px)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_14px)]" />

            <div className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
                <div className="w-full rounded-2xl border border-white/10 bg-[var(--color-surface-2)]/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="font-display text-2xl font-semibold text-white">
                                SAFIO
                            </h1>
                        </div>

                        <div className="grid gap-3">
                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30"
                            >
                                <SiGoogle className="h-4 w-4" />
                                Continuar com Google
                            </button>
                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/30"
                            >
                                <SiGithub className="h-4 w-4" />
                                Continuar com GitHub
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-white/10" />
                            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                ou
                            </span>
                            <span className="h-px flex-1 bg-white/10" />
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel
                                    htmlFor="name"
                                    value="Nome completo"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        placeholder="Seu nome completo"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="username"
                                    value="Usuário"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="username"
                                        name="username"
                                        value={data.username}
                                        placeholder="Seu usuário"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="username"
                                        onChange={(e) => setData('username', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError
                                    message={errors.username}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="email"
                                    value="E-mail"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="seuemail@dominio.com"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Senha"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        placeholder="Crie uma senha segura"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password_confirmation"
                                    value="Confirmar senha"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        placeholder="Repita a senha"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setData('password_confirmation', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="cpf"
                                    value="CPF"
                                    className="text-slate-200"
                                />
                                <div className="relative mt-1">
                                    <FiCreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="cpf"
                                        name="cpf"
                                        value={data.cpf}
                                        placeholder="000.000.000-00"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        inputMode="numeric"
                                        maxLength={14}
                                        onChange={(e) =>
                                            setData('cpf', formatCpf(e.target.value))
                                        }
                                        required
                                    />
                                </div>
                                <InputError message={errors.cpf} className="mt-2" />
                            </div>

                            <div>
                                <label className="flex items-start gap-3 text-sm text-slate-400">
                                    <Checkbox
                                        name="terms"
                                        checked={data.terms}
                                        required
                                        onChange={(e) =>
                                            setData('terms', e.target.checked)
                                        }
                                        className="mt-0.5 border-white/20 bg-black/40 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                    />
                                    <span>
                                        Li e aceito os{' '}
                                        <button
                                            type="button"
                                            onClick={() => setActiveModal('terms')}
                                            className="font-display font-semibold text-white hover:text-rose-200"
                                        >
                                            Termos de Uso
                                        </button>{' '}
                                        e a{' '}
                                        <button
                                            type="button"
                                            onClick={() => setActiveModal('privacy')}
                                            className="font-display font-semibold text-white hover:text-rose-200"
                                        >
                                            Política de Privacidade
                                        </button>
                                        .
                                    </span>
                                </label>
                                <InputError message={errors.terms} className="mt-2" />
                            </div>

                            <PrimaryButton
                                className="w-full !text-white"
                                disabled={processing}
                                variant="red"
                                type="submit"
                            >
                                Criar conta
                            </PrimaryButton>
                        </form>

                        <div className="text-center text-sm text-slate-400">
                            Já tem conta?{' '}
                            <Link
                                href={route('login')}
                                className="font-display font-semibold text-white hover:text-rose-200"
                            >
                                Entrar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                <button
                    type="button"
                    className="absolute inset-0 bg-black/70"
                    onClick={() => setActiveModal(null)}
                    aria-label="Fechar modal"
                />
                <div
                    role="dialog"
                    aria-modal="true"
                    className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-surface-2)]/95 p-6 text-slate-200 shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
                >
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="font-display text-lg font-semibold text-white">
                            {activeModal === 'terms'
                                ? 'Termos de Uso'
                                : 'Política de Privacidade'}
                        </h2>
                        <button
                            type="button"
                            className="text-sm text-slate-400 transition hover:text-white"
                            onClick={() => setActiveModal(null)}
                        >
                            Fechar
                        </button>
                    </div>
                    <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-sm text-slate-300">
                        {(activeModal === 'terms'
                            ? TERMS_SECTIONS
                            : PRIVACY_SECTIONS
                        ).map((section) => (
                            <section
                                key={section.title}
                                className="rounded-xl border border-white/10 bg-black/40 p-4"
                            >
                                <h3 className="font-display text-sm font-semibold text-white">
                                    {section.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    {section.body}
                                </p>
                            </section>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                            onClick={() => setActiveModal(null)}
                        >
                            Fechar
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                            onClick={() => {
                                setData('terms', true);
                                setActiveModal(null);
                            }}
                        >
                            Li e aceito
                        </button>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}
