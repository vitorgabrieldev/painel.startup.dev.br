import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiLock, FiMail } from 'react-icons/fi';
import { SiGithub, SiGoogle } from 'react-icons/si';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

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
            <Head title="Entrar" />
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

                        {status && (
                            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
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
                                        isFocused={true}
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
                                        placeholder="Sua senha"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-400">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked)
                                        }
                                        className="border-white/20 bg-black/40 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                                    />
                                    Manter conectado
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="font-display text-sm font-medium text-rose-200 hover:text-white"
                                    >
                                        Esqueci minha senha
                                    </Link>
                                )}
                            </div>

                            <PrimaryButton
                                className="w-full !text-white"
                                disabled={processing}
                                variant="red"
                                type="submit"
                            >
                                Entrar
                            </PrimaryButton>
                        </form>

                        <div className="text-center text-sm text-slate-400">
                            Ainda não tem conta?{' '}
                            <Link
                                href={route('register')}
                                className="font-display font-semibold text-white hover:text-rose-200"
                            >
                                Criar conta
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
