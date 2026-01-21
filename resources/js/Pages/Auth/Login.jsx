import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiLock, FiMail } from 'react-icons/fi';

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
        <div className="relative min-h-screen bg-[var(--color-surface)]">
            <Head title="Entrar" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#EDE9FE,transparent_60%),radial-gradient(circle_at_bottom,#F5EFFF,transparent_55%)]" />

            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
                <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
                    <div className="hidden flex-col gap-6 lg:flex">
                        <div className="font-display inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary)]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-dark)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                            SAFIO
                        </div>
                        <h1 className="font-display text-4xl font-semibold text-[var(--color-dark)]">
                            Decisões técnicas com visão de negócio, em um só lugar.
                        </h1>
                        <p className="text-base text-gray-600">
                            Centralize propósito, stack, padrões e riscos por projeto,
                            mantendo clareza para o time e evitando retrabalho.
                        </p>
                        <div className="grid gap-3 text-sm text-gray-600">
                            {[
                                'Contexto técnico vivo para onboarding rápido',
                                'Histórico de decisões sem ruído operacional',
                                'Visão realista para reduzir dívida técnica',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-xl border border-[var(--color-secondary)]/10 bg-white/80 px-4 py-3 shadow-sm"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-secondary)]/10 bg-white p-8 shadow-xl">
                        <div className="mb-6">
                            <h2 className="font-display text-2xl font-semibold text-[var(--color-dark)]">
                                Entrar na sua conta
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Continue de onde parou e mantenha o contexto do seu projeto.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="email" value="E-mail" />
                                <div className="relative mt-1">
                                    <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="seuemail@dominio.com"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Senha" />
                                <div className="relative mt-1">
                                    <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        placeholder="Sua senha"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked)
                                        }
                                    />
                                    Manter conectado
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="font-display text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
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

                            <div className="mt-6 text-center text-sm text-gray-600">
                                Ainda não tem conta?{' '}
                            <Link
                                href={route('register')}
                                className="font-display font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
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
