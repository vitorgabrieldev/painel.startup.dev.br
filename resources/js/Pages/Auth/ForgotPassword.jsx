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
            <Head title="Recuperar senha" />
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
                            <p className="mt-2 text-sm text-slate-400">
                                Recuperar senha
                            </p>
                        </div>

                        {status && (
                            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <div className="relative mt-1">
                                    <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="seuemail@dominio.com"
                                        className="block w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
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

                        <div className="text-center text-sm text-slate-400">
                            Lembrou a senha?{' '}
                            <Link
                                href={route('login')}
                                className="font-display font-semibold text-white hover:text-rose-200"
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
