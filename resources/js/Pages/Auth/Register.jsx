import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative min-h-screen bg-[var(--color-surface)]">
            <Head title="Criar conta" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#EDE9FE,transparent_60%),radial-gradient(circle_at_bottom,#F5EFFF,transparent_55%)]" />

            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
                <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
                    <div className="hidden flex-col gap-6 lg:flex">
                        <div className="font-display inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary)]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-dark)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                            SAFIO
                        </div>
                        <h1 className="font-display text-4xl font-semibold text-[var(--color-dark)]">
                            Transforme decisões técnicas em vantagem de negócio.
                        </h1>
                        <p className="text-base text-gray-600">
                            Construa memória de projeto, reduza risco e acelere a
                            tomada de decisão com contexto estruturado.
                        </p>
                        <div className="grid gap-3 text-sm text-gray-600">
                            {[
                                'Projetos organizados por propósito e stack',
                                'Acompanhamento de riscos e padrões',
                                'Resumo claro para lideranças e novos devs',
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
                                Comece seu primeiro projeto
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Leva menos de 1 minuto para organizar seu contexto técnico.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Nome completo" />
                                <div className="relative mt-1">
                                    <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        placeholder="Seu nome completo"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-2" />
                            </div>

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
                                        placeholder="Crie uma senha segura"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
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
                                />
                                <div className="relative mt-1">
                                    <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        placeholder="Repita a senha"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
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
                                <label className="flex items-start gap-3 text-sm text-gray-600">
                                    <Checkbox
                                        name="terms"
                                        checked={data.terms}
                                        required
                                        onChange={(e) =>
                                            setData('terms', e.target.checked)
                                        }
                                        className="mt-0.5"
                                    />
                                    <span>
                                        Li e aceito os{' '}
                                        <Link
                                            href={route('legal.terms')}
                                            className="font-display font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                                        >
                                            Termos de Uso
                                        </Link>{' '}
                                        e a{' '}
                                        <Link
                                            href={route('legal.privacy')}
                                            className="font-display font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                                        >
                                            Política de Privacidade
                                        </Link>
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

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Já tem conta?{' '}
                            <Link
                                href={route('login')}
                                className="font-display font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                            >
                                Entrar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
