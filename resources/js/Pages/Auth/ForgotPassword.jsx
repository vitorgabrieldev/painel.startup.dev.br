import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FiMail } from 'react-icons/fi';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <div className="relative min-h-screen bg-[var(--color-surface)]">
            <Head title="Recuperar senha" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#EDE9FE,transparent_60%),radial-gradient(circle_at_bottom,#F5EFFF,transparent_55%)]" />

            <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
                <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
                    <div className="hidden flex-col gap-6 lg:flex">
                        <div className="font-display inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary)]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-dark)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                            SAFIO
                        </div>
                        <h1 className="font-display text-4xl font-semibold text-[var(--color-dark)]">
                            Recupere o acesso sem perder o contexto do projeto.
                        </h1>
                        <p className="text-base text-gray-600">
                            Envie seu e-mail e nós te ajudamos a voltar ao seu painel
                            rapidamente, com segurança.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-secondary)]/10 bg-white p-8 shadow-xl">
                        <div className="mb-6">
                            <h2 className="font-display text-2xl font-semibold text-[var(--color-dark)]">
                                Esqueci minha senha
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Informe seu e-mail para receber o link de redefinição.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <div className="relative mt-1">
                                    <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="seuemail@dominio.com"
                                        className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--color-dark)] shadow-sm focus:border-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/20"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <PrimaryButton
                                className="w-full !text-white"
                                disabled={processing}
                                variant="red"
                                type="submit"
                            >
                                Enviar link de redefinição
                            </PrimaryButton>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Lembrou a senha?{' '}
                            <Link
                                href={route('login')}
                                className="font-display font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                            >
                                Voltar para o login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
