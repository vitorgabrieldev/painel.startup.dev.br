import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { FiBell, FiCheck, FiTrash2, FiUser } from 'react-icons/fi';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const avatarUrl = user?.avatar_url
        ? `${user.avatar_url}?v=${user.updated_at || user.id}`
        : null;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const [inviteProcessing, setInviteProcessing] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const notifRef = useRef(null);

    const loadNotifications = async () => {
        try {
            const { data } = await axios.get(route('notifications.index'));
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            // ignore
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = (event) => {
            if (
                notifRef.current &&
                !notifRef.current.contains(event.target)
            ) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        if (notifLoading) return;
        setNotifLoading(true);
        try {
            await axios.post(route('notifications.markAll'));
            await loadNotifications();
        } catch (error) {
            //
        } finally {
            setNotifLoading(false);
        }
    };

    const deleteAll = async () => {
        if (notifLoading) return;
        setNotifLoading(true);
        try {
            await axios.delete(route('notifications.deleteAll'));
            await loadNotifications();
        } catch (error) {
            //
        } finally {
            setNotifLoading(false);
        }
    };

    const markRead = async (id) => {
        try {
            await axios.post(route('notifications.read', id));
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
                ),
            );
            setUnreadCount((prev) => Math.max(prev - 1, 0));
        } catch (error) {
            //
        }
    };

    const deleteOne = async (id) => {
        try {
            setDeletingId(id);
            await axios.delete(route('notifications.delete', id));
            setNotifications((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            //
        } finally {
            setDeletingId((prev) => (prev === id ? null : prev));
        }
    };

    const markInvite = async (notification, accept) => {
        const inviteId =
            notification.data?.invite_id || notification.data?.inviteId || notification.data?.id;
        if (!inviteId) return;
        try {
            setInviteProcessing({ id: notification.id, accept });
            await axios.post(
                route(
                    accept ? 'projects.invites.accept' : 'projects.invites.reject',
                    inviteId,
                ),
            );
            setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
            setUnreadCount((prev) => Math.max(prev - 1, 0));
            if (accept) {
                const actionUrl = notification.data?.action_url;
                const projectUuid =
                    notification.data?.project_uuid ||
                    notification.data?.projectUuid ||
                    notification.data?.project_id ||
                    notification.data?.projectId;
                if (actionUrl) {
                    window.location.href = actionUrl;
                } else if (projectUuid) {
                    window.location.href = route('projects.show', projectUuid);
                }
            } else {
                await loadNotifications();
            }
        } catch (error) {
            //
        } finally {
            setInviteProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Criar novo projeto
                                </NavLink>
                                <NavLink
                                    href={route('projects.index')}
                                    active={route().current('projects.index')}
                                >
                                    Projetos
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-4">
                            <div className="relative" ref={notifRef}>
                                <button
                                    type="button"
                                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-gray-500 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                                    onClick={() => {
                                        setNotifOpen((prev) => !prev);
                                        if (!notifOpen) loadNotifications();
                                    }}
                                >
                                    <FiBell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1.5 -top-1.5 min-h-[18px] min-w-[18px] rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notifOpen && (
                                    <div className="notification-popover">
                                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                            <span className="text-sm font-semibold text-gray-800">
                                                Notificações
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="notif-action"
                                                    onClick={markAllRead}
                                                    disabled={notifLoading}
                                                >
                                                    <FiCheck className="h-4 w-4" />
                                                    <span>Marcar lidas</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="notif-action"
                                                    onClick={deleteAll}
                                                    disabled={notifLoading}
                                                >
                                                    <FiTrash2 className="h-4 w-4" />
                                                    <span>Limpar</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="notif-list">
                                            {notifications.length === 0 && (
                                                <div className="notif-empty">
                                                    Não há nada aqui :\
                                                </div>
                                            )}
                                            {notifications.map((item) => {
                                                const isInvite = item.type === 'project_invite' || item.data?.type === 'project_invite';
                                                const isProcessingInvite =
                                                    inviteProcessing?.id === item.id;
                                                const isProcessingAccept =
                                                    isProcessingInvite && inviteProcessing?.accept;
                                                const isProcessingReject =
                                                    isProcessingInvite && inviteProcessing && !inviteProcessing.accept;
                                                const isDeleting = deletingId === item.id;
                                                const inviteDisabled =
                                                    isProcessingInvite ||
                                                    notifLoading ||
                                                    deletingId !== null;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`notif-item ${
                                                            item.read_at ? 'is-read' : 'is-unread'
                                                        } ${isInvite ? 'is-invite' : ''}`}
                                                    >
                                                        <div className="notif-text">
                                                            <div className="notif-title">
                                                                {item.title}
                                                            </div>
                                                            {item.message && (
                                                                <div className="notif-message">
                                                                    {item.message}
                                                                </div>
                                                            )}
                                                            <div className="notif-meta">
                                                                {new Date(
                                                                    item.created_at,
                                                                ).toLocaleString('pt-BR')}
                                                            </div>
                                                            {isInvite && (
                                                                <div className="notif-invite-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="invite-accept"
                                                                        disabled={inviteDisabled}
                                                                        onClick={() =>
                                                                            markInvite(item, true)
                                                                        }
                                                                    >
                                                                        {isProcessingAccept ? (
                                                                            <span className="btn-spinner" />
                                                                        ) : null}
                                                                        {isProcessingAccept ? 'Processando...' : 'Aceitar'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="invite-reject"
                                                                        disabled={inviteDisabled}
                                                                        onClick={() =>
                                                                            markInvite(item, false)
                                                                        }
                                                                    >
                                                                        {isProcessingReject ? (
                                                                            <span className="btn-spinner" />
                                                                        ) : null}
                                                                        {isProcessingReject ? 'Processando...' : 'Recusar'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="notif-actions">
                                                            {!item.read_at && (
                                                                <button
                                                                    type="button"
                                                                    className="notif-dot"
                                                                    onClick={() => markRead(item.id)}
                                                                    title="Marcar como lida"
                                                                />
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="notif-delete"
                                                                onClick={() => deleteOne(item.id)}
                                                                disabled={isDeleting}
                                                                title="Excluir"
                                                            >
                                                                {isDeleting ? (
                                                                    <span className="btn-spinner" />
                                                                ) : (
                                                                    <FiTrash2 className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-gray-400">
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt="Avatar do usuário"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <FiUser className="h-4 w-4" />
                                                    )}
                                                </span>
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Perfil
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Sair
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Painel
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('projects.index')}
                            active={route().current('projects.index')}
                        >
                            Projetos
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-gray-400">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar do usuário"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <FiUser className="h-5 w-5" />
                                )}
                            </span>
                            <div>
                                <div className="text-base font-medium text-gray-800">
                                    {user.name}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Sair
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
