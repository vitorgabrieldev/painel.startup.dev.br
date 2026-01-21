import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Privacy() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-display text-xl font-semibold leading-tight text-gray-800">
                    Política de Privacidade
                </h2>
            }
        >
            <Head title="Política de Privacidade" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end">
                        <Link
                            href={route('profile.edit')}
                            className="font-display rounded-lg border border-[var(--color-secondary)]/20 px-4 py-2 text-sm font-semibold text-[var(--color-dark)] transition hover:border-[var(--color-secondary)]"
                        >
                            Voltar para o perfil
                        </Link>
                    </div>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            1. Dados coletados
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Coletamos dados de cadastro, informações fornecidas por
                            você e dados técnicos de uso para operar o serviço e
                            manter a segurança da plataforma.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            2. Uso das informações
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Usamos os dados para autenticar usuários, fornecer os
                            recursos contratados, melhorar a experiência e cumprir
                            obrigações legais. Não vendemos seus dados.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            3. Compartilhamento e operadores
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Podemos compartilhar dados com fornecedores essenciais
                            (como hospedagem, processamento de pagamento e analíticos),
                            sempre com medidas contratuais de confidencialidade e
                            apenas na medida necessária para operar o serviço.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            4. Pagamentos e dados financeiros
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Pagamentos são processados por provedores especializados.
                            O Safio não armazena dados completos de cartão. Informações
                            de cobrança podem ser registradas para fins fiscais e de
                            suporte.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            5. Segurança da informação
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Aplicamos medidas técnicas e organizacionais razoáveis
                            para proteger dados contra acesso não autorizado, perda
                            ou alteração. Ainda assim, nenhum método é infalível.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            6. Retenção e exclusão
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Mantemos dados pelo tempo necessário para a prestação do
                            serviço e para cumprimento de obrigações legais. A
                            exclusão pode ser solicitada conforme a legislação
                            aplicável, com limites técnicos e legais.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            7. Direitos do titular
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Você pode solicitar acesso, correção, portabilidade ou
                            exclusão de dados pessoais, conforme as bases legais.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            8. Alterações desta política
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Podemos atualizar esta Política periodicamente. O uso
                            continuado do Safio após alterações indica concordância
                            com a versão vigente.
                        </p>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
