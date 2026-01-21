import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Terms() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-display text-xl font-semibold leading-tight text-gray-800">
                    Termos de Uso
                </h2>
            }
        >
            <Head title="Termos de Uso" />

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
                            1. Aceite
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Ao acessar o Safio, você declara ter lido, compreendido e
                            aceitado estes Termos de Uso e a Política de Privacidade.
                            Caso não concorde, não utilize a plataforma.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            2. Descrição do serviço
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            O Safio é uma plataforma de organização de decisões
                            técnicas e memória de projeto. O serviço pode incluir
                            funcionalidades de colaboração, histórico, assistência
                            automatizada e integrações, podendo sofrer ajustes ou
                            atualizações a qualquer momento.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            3. Conta e responsabilidades do usuário
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Você é responsável por manter a confidencialidade das
                            credenciais, por todas as atividades realizadas na sua
                            conta e pelo conteúdo inserido. É proibido utilizar o
                            Safio para fins ilegais, ofensivos ou que infrinjam
                            direitos de terceiros.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            4. Planos, assinaturas e pagamentos
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            O acesso a recursos pode depender de planos pagos e
                            assinaturas recorrentes. Valores, benefícios, limites e
                            regras de cobrança serão informados no momento da
                            contratação. Em caso de inadimplência, podemos suspender
                            o acesso até a regularização.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            5. Renovação, cancelamento e reembolsos
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Assinaturas podem ser renovadas automaticamente conforme
                            o plano escolhido. O usuário pode solicitar cancelamento
                            a qualquer momento, com efeitos ao final do ciclo vigente,
                            salvo disposição legal em contrário. Reembolsos, quando
                            aplicáveis, seguem a política informada no momento da
                            compra e a legislação vigente.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            6. Propriedade intelectual e conteúdo do usuário
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            O Safio, marcas, layout e tecnologia são protegidos por
                            direitos autorais. O conteúdo inserido por você permanece
                            seu, e você concede ao Safio licença limitada para
                            processar tais dados exclusivamente para a prestação do
                            serviço.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            7. Disponibilidade e limitação de responsabilidade
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Embora busquemos alta disponibilidade, o serviço pode
                            sofrer indisponibilidades, manutenções e falhas fora do
                            controle. O Safio não garante resultados de negócio e
                            não se responsabiliza por danos indiretos, lucros cessantes,
                            perda de dados ou interrupção de atividades.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            8. Encerramento e suspensão
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Podemos suspender ou encerrar contas em caso de violação
                            destes Termos, uso indevido ou exigência legal. Em caso de
                            encerramento, o acesso aos dados pode ser limitado ou
                            removido conforme política vigente e obrigações legais.
                        </p>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-gray-900">
                            9. Alterações nos termos
                        </h3>
                        <p className="mt-3 text-base leading-relaxed text-gray-700">
                            Os Termos podem ser atualizados periodicamente. O uso
                            continuado do Safio após as alterações indica concordância
                            com a versão vigente.
                        </p>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
