import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Safio Studio';

function MobileGate({ children }) {
    const [blocked, setBlocked] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 1023px)');
        const update = () => setBlocked(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    if (!blocked) return children;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-6 py-12">
            <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                    <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="4" width="20" height="14" rx="2" />
                        <path d="M8 20h8" />
                        <path d="M12 18v2" />
                    </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                    Para melhor experiência, acesse no desktop
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Esta área foi otimizada para telas maiores. Em breve teremos
                    versão mobile.
                </p>
            </div>
        </div>
    );
}

createInertiaApp({
    title: (title) =>
        title && title !== appName ? `${title} - ${appName}` : appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <MobileGate>
                <App {...props} />
            </MobileGate>,
        );
    },
    progress: {
        color: '#F81A42',
    },
});
