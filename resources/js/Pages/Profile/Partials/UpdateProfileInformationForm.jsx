import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FiUser } from 'react-icons/fi';

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

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarAutoSubmit, setAvatarAutoSubmit] = useState(false);

    const avatarUrl = useMemo(() => {
        if (avatarPreview) return avatarPreview;
        if (!user?.avatar_url) return null;
        return `${user.avatar_url}?v=${user.updated_at || user.id}`;
    }, [avatarPreview, user]);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            username: user.username ?? '',
            email: user.email,
            cpf: user.cpf ? formatCpf(user.cpf) : '',
            _method: 'patch',
        });

    const {
        data: avatarData,
        setData: setAvatarData,
        post: postAvatar,
        errors: avatarErrors,
        processing: avatarProcessing,
    } = useForm({
        avatar: null,
        avatar_remove: false,
    });

    useEffect(() => {
        if (!user) return;
        setData('name', user.name ?? '');
        setData('username', user.username ?? '');
        setData('email', user.email ?? '');
        setData('cpf', user.cpf ? formatCpf(user.cpf) : '');
    }, [user?.id]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'));
    };

    const handleAvatarFile = (file) => {
        if (!file) return;
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarData('avatar', file);
        setAvatarData('avatar_remove', false);
        setAvatarAutoSubmit(true);
    };

    useEffect(() => {
        if (!avatarAutoSubmit) return;
        if (!(avatarData.avatar instanceof File)) {
            setAvatarAutoSubmit(false);
            return;
        }

        postAvatar(route('profile.avatar.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['auth'], preserveScroll: true });
                if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                }
                setAvatarPreview(null);
                setAvatarData('avatar', null);
                setAvatarData('avatar_remove', false);
            },
            onFinish: () => setAvatarAutoSubmit(false),
        });
    }, [avatarAutoSubmit, avatarData.avatar, avatarPreview, postAvatar, setAvatarData]);

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Informações do perfil
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Atualize os dados do seu perfil e o e-mail da conta.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="avatar" value="Avatar" />
                    <div className="mt-2 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-gray-400">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar do usuário"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <FiUser className="h-8 w-8" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                disabled={avatarProcessing}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    handleAvatarFile(file);
                                }}
                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (avatarPreview) {
                                        URL.revokeObjectURL(avatarPreview);
                                    }
                                    setAvatarPreview(null);
                                    setAvatarData('avatar', null);
                                    setAvatarData('avatar_remove', true);
                                    postAvatar(route('profile.avatar.update'), {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            router.reload({ only: ['auth'], preserveScroll: true });
                                            setAvatarData('avatar_remove', false);
                                        },
                                    });
                                }}
                                className="text-left text-xs font-semibold text-gray-500 underline decoration-gray-400/50 transition hover:text-[var(--color-secondary)]"
                            >
                                Remover avatar
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Aceita PNG ou JPG de até 2MB.
                    </p>
                    <InputError className="mt-2" message={avatarErrors.avatar} />
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Nome completo" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="username" value="Usuário" />

                    <TextInput
                        id="username"
                        className="mt-1 block w-full"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.username} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="E-mail" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="cpf" value="CPF" />

                    <TextInput
                        id="cpf"
                        className="mt-1 block w-full"
                        value={data.cpf}
                        onChange={(e) => setData('cpf', formatCpf(e.target.value))}
                        inputMode="numeric"
                        maxLength={14}
                        autoComplete="off"
                    />

                    <InputError className="mt-2" message={errors.cpf} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Seu e-mail ainda não foi verificado.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Clique aqui para reenviar o e-mail de verificação.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Um novo link de verificação foi enviado para o seu e-mail.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton
                        disabled={processing}
                        loading={processing}
                        type="submit"
                    >
                        Salvar
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Salvo.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
