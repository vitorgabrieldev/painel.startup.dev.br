import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '', isSocialUser = false }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const confirmationInput = useRef();
    const user = usePage().props.auth.user;
    const confirmationHint = user?.username || 'seu username';

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
        confirmation: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                if (isSocialUser) {
                    confirmationInput.current?.focus();
                } else {
                    passwordInput.current?.focus();
                }
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Excluir conta
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Após a exclusão da sua conta, todos os seus recursos e dados serão apagados permanentemente. Antes de excluir sua conta, faça o download de quaisquer dados ou informações que deseje manter.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Excluir conta
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Tem certeza de que deseja excluir sua conta?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Após a exclusão da sua conta, todos os seus recursos e dados serão apagados permanentemente. Antes de excluir sua conta, faça o download de quaisquer dados ou informações que deseje manter.
                    </p>

                    <div className="mt-6">
                        {isSocialUser ? (
                            <>
                                <InputLabel
                                    htmlFor="confirmation"
                                    value={`Digite seu username (${confirmationHint}) para confirmar`}
                                />
                                <TextInput
                                    id="confirmation"
                                    name="confirmation"
                                    ref={confirmationInput}
                                    value={data.confirmation}
                                    onChange={(e) =>
                                        setData('confirmation', e.target.value)
                                    }
                                    className="mt-1 block w-3/4"
                                    isFocused
                                    placeholder={confirmationHint}
                                />
                                <InputError
                                    message={errors.confirmation}
                                    className="mt-2"
                                />
                            </>
                        ) : (
                            <>
                                <InputLabel
                                    htmlFor="password"
                                    value="Senha"
                                    className="sr-only"
                                />

                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className="mt-1 block w-3/4"
                                    isFocused
                                    placeholder="Senha"
                                />

                                <InputError
                                    message={errors.password}
                                    className="mt-2"
                                />
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>

                        <DangerButton
                            className="ms-3"
                            disabled={processing}
                            type="submit"
                        >
                            Excluir conta
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
