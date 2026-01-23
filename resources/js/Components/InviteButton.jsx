import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { Modal, Input, message } from 'antd';
import axios from 'axios';

export default function InviteButton({ projectId }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const sendInvite = async () => {
        if (!email.trim()) return;
        setLoading(true);
        try {
            await axios.post(route('projects.invites.store', projectId), {
                email,
            });
            message.success('Convite enviado.');
            setEmail('');
            setOpen(false);
        } catch (error) {
            message.error('Não foi possível enviar convite.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                onClick={() => setOpen(true)}
            >
                <FiSend className="h-4 w-4" />
                Convidar
            </button>
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                onOk={sendInvite}
                okText="Enviar"
                confirmLoading={loading}
                title="Convidar para o projeto"
            >
                <p className="text-sm text-gray-600">
                    Digite o e-mail do usuário que já tem conta para enviar o convite.
                </p>
                <Input
                    className="mt-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                />
            </Modal>
        </>
    );
}
