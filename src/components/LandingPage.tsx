import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MapCommandProvider } from '@/contexts/MapCommandContext';
import ChatBot from './ChatBot';
import { AuthModal } from './AuthModal';

const LandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    // Dark Mode Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
    };

    const handleAccessPlatform = () => {
        if (user) {
            navigate('/platform');
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const faqs = [
        { q: "O que é a Envibase?", a: "Envibase é um Sistema de Gerenciamento de Dados Ambientais (SGDA) holístico. Ela permite consolidar terabytes de dados geoespaciais e sensores locais em uma interface intuitiva de monitoramento." },
        { q: "Por que eu preciso da Envibase?", a: "Para simplificar e automatizar seus estudos ambientais, centralizando organização, análise e visualização de dados em um único ambiente seguro." },
        { q: "Por que pagar para usar a Envibase?", a: "Oferecemos processamento avançado, backups contínuos, capacidade expandida e suporte dedicado projetados para fluxos de dados corporativos e alta confiabilidade." },
        { q: "Meus dados ambientais estão seguros?", a: "Sim. A Envibase utiliza segurança online via Cloudflare, banco de dados relacional protegido com backups periódicos restritos." },
        { q: "Quem pode ver meus dados privados?", a: "Apenas você e os membros da equipe com as permissões apropriadas. Dados privados são estritamente particionados pelo nosso modelo de segurança." },
        { q: "Como faço para baixar uma tabela da Envibase?", a: "Basta acessar o dashboard de qualquer projeto, selecionar o dataset desejado e clicar no botão de exportação nos formatos padrão (CSV, Excel)." }
    ];

    return (
        <div className="min-h-screen bg-landing-paper dark:bg-background text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-landing-primary/30 transition-colors duration-500">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${isScrolled ? 'glass-card border-b border-landing-navy/10 dark:border-white/10' : 'bg-transparent'}`}>
                <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 h-20">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 bg-landing-navy dark:bg-landing-primary rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}>eco</span>
                        </div>
                        <span className="font-bold tracking-tight text-2xl font-display text-landing-navy dark:text-white">
                            Envibase<span className="text-landing-primary">.</span>
                        </span>
                    </div>

                    <div className="hidden md:flex gap-10 text-[13px] font-medium text-landing-navy/70 dark:text-gray-300">
                        <a href="#layers" className="hover:text-landing-primary transition-colors flex items-center gap-2">Funcionalidades</a>
                        <a href="#pricing" className="hover:text-landing-primary transition-colors flex items-center gap-2">Preços</a>
                        <a href="#faq" className="hover:text-landing-primary transition-colors flex items-center gap-2">FAQ</a>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={toggleTheme}
                            className="text-landing-navy dark:text-white hover:text-landing-primary transition-colors w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-envibase-surface border border-landing-navy/10 dark:border-white/10"
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <button
                            onClick={handleAccessPlatform}
                            className="hidden md:block bg-landing-navy dark:bg-white text-white dark:text-landing-navy px-6 py-2.5 rounded-full text-sm font-medium hover:bg-landing-primary hover:dark:bg-gray-200 transition-colors shadow-lg shadow-landing-navy/20 dark:shadow-white/10"
                        >
                            Acessar Plataforma
                        </button>
                        <button
                            className="md:hidden text-landing-navy dark:text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed top-20 left-0 right-0 z-50 p-6 glass-card border-b border-landing-navy/10 dark:border-white/10 animate-fade-in bg-white dark:bg-background">
                    <div className="flex flex-col gap-6">
                        <a href="#layers" className="text-lg font-display font-bold text-landing-navy dark:text-white hover:text-landing-primary" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
                        <a href="#pricing" className="text-lg font-display font-bold text-landing-navy dark:text-white hover:text-landing-primary" onClick={() => setMobileMenuOpen(false)}>Preços</a>
                        <a href="#faq" className="text-lg font-display font-bold text-landing-navy dark:text-white hover:text-landing-primary" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                        <hr className="border-landing-navy/5 dark:border-white/5" />
                        <button
                            onClick={handleAccessPlatform}
                            className="bg-landing-navy dark:bg-white text-white dark:text-landing-navy w-full py-4 rounded-xl font-bold"
                        >
                            Acessar Plataforma
                        </button>
                    </div>
                </div>
            )}

            <main>
                {/* Hero Section */}
                <section className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-6 md:px-8 relative overflow-hidden">
                    <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-landing-primary/5 dark:bg-landing-primary/10 rounded-full blur-[100px] -z-10"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-landing-emerald/5 dark:bg-landing-emerald/5 rounded-full blur-[120px] -z-10"></div>

                    <div className="max-w-[1240px] w-full grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-6 z-10">
                            <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-envibase-surface/40 backdrop-blur-sm border border-landing-navy/10 dark:border-white/10 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-landing-emerald animate-pulse"></span>
                                <span className="text-xs font-semibold text-landing-navy/80 dark:text-gray-300 uppercase tracking-wider">Sistema 2026.1 Online</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8 text-landing-navy dark:text-white font-display">
                                Assuma o controle dos seus dados ambientais.
                            </h1>
                            <p className="text-xl text-[#4A5568] dark:text-gray-400 max-w-lg mb-10 font-light leading-relaxed">
                                A Envibase simplifica e automatiza seus estudos ambientais, organizando seus dados e eliminando a necessidade de usar vários aplicativos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAccessPlatform}
                                    className="bg-landing-primary text-white font-medium rounded-full px-8 py-4 text-[15px] flex items-center justify-center gap-3 shadow-xl shadow-landing-primary/20 dark:shadow-landing-primary/10 hover:-translate-y-1 transition-transform"
                                >
                                    Começar Agora
                                    <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
                                </button>
                                <button className="bg-white dark:bg-transparent text-landing-navy dark:text-white font-medium rounded-full px-8 py-4 text-[15px] border border-landing-navy/10 dark:border-white/20 flex items-center justify-center gap-3 shadow-sm hover:border-landing-navy/30 dark:hover:border-white/40 transition-colors">
                                    Ver Vídeo
                                    <span className="material-symbols-outlined text-lg">play_circle</span>
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-6 relative">
                            <div className="relative rounded-3xl overflow-hidden glass-card p-2 shadow-2xl dark:shadow-none dark:border-white/10 dark:bg-envibase-surface/30">
                                <img
                                    src="/Controle_seus_dados_ambientais_7c6a18d2d3.jpeg"
                                    alt="Controle seus dados ambientais"
                                    className="w-full rounded-2xl shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Partners */}
                <section className="py-20 bg-landing-paper dark:bg-envibase-surface/50 border-y border-landing-navy/5 dark:border-white/5">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-8">
                        <div className="text-center mb-12">
                            <span className="text-xs font-bold text-landing-navy/40 dark:text-white/40 uppercase tracking-[0.2em]">Plataforma acelerada por</span>
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
                            <div className="ethereal-glass px-10 py-6 flex items-center gap-4 partner-logo cursor-default dark:bg-landing-navy/40 dark:border-white/10 dark:shadow-none">
                                <span className="material-symbols-outlined text-landing-primary text-3xl">rocket_launch</span>
                                <span className="font-bold tracking-tighter text-2xl font-display text-landing-navy dark:text-white">CATALISA</span>
                            </div>
                            <div className="ethereal-glass px-10 py-6 flex items-center gap-4 partner-logo cursor-default dark:bg-landing-navy/40 dark:border-white/10 dark:shadow-none">
                                <span className="material-symbols-outlined text-landing-primary text-3xl">hub</span>
                                <span className="font-bold tracking-tighter text-2xl font-display text-landing-navy dark:text-white">CONECTA</span>
                            </div>
                            <div className="ethereal-glass px-10 py-6 flex items-center gap-4 partner-logo cursor-default dark:bg-landing-navy/40 dark:border-white/10 dark:shadow-none">
                                <span className="material-symbols-outlined text-landing-primary text-3xl">science</span>
                                <span className="font-bold tracking-tighter text-2xl font-display text-landing-navy dark:text-white">MCTI</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Layers / Bento Grid */}
                <section id="layers" className="max-w-[1200px] mx-auto px-6 md:px-8 py-32">
                    <div className="text-center mb-20">
                        <span className="technical-annotation mb-3 block text-landing-primary">O que você ganha</span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-landing-navy dark:text-white font-display">Vantagens da Envibase</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bento-item md:col-span-2 bg-white dark:bg-envibase-surface/40">
                            <div className="w-12 h-12 rounded-2xl bg-landing-emerald/10 flex items-center justify-center mb-6 text-landing-emerald">
                                <span className="material-symbols-outlined">folder_managed</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-landing-navy dark:text-white font-display">Organização</h3>
                            <p className="text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed">
                                Criar e organizar projetos. Armazenar dados organizadamente. Compartilhar dados privadamente com sua equipe.
                            </p>
                        </div>

                        <div className="bento-item bg-white dark:bg-envibase-surface/40">
                            <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center mb-6 text-landing-primary">
                                <span className="material-symbols-outlined">monitoring</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-landing-navy dark:text-white font-display">Produtividade</h3>
                            <p className="text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed">
                                Gerar gráficos de barras, estatísticas box plot e plotar gráficos em mapas instantaneamente.
                            </p>
                        </div>

                        <div className="bento-item bg-white dark:bg-envibase-surface/40">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-landing-navy dark:text-white font-display">Descoberta</h3>
                            <p className="text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed">
                                Comparar dados de projetos. Encontrar dados públicos e salvar favoritos.
                            </p>
                        </div>

                        <div className="bento-item md:col-span-2 !bg-[#0A192F] dark:!bg-[#12213A] border-none text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-[60px] -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-[#00E676]">
                                    <span className="material-symbols-outlined">security</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3 font-display">Segurança & Economia</h3>
                                <p className="text-white/70 leading-relaxed max-w-md">
                                    Banco de dados relacional, segurança online Cloudflare, backups periódicos. Versão grátis e preços promocionais, reduzindo riscos de erros e prejuízos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Narrative / Book Section */}
                <section className="py-24 bg-white dark:bg-envibase-surface border-y border-landing-navy/5 dark:border-white/5">
                    <div className="max-w-[1200px] mx-auto px-6 md:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="relative flex justify-center lg:justify-start">
                                <div className="relative w-full max-w-[450px]">
                                    <div className="relative z-10 floating-book drop-shadow-[0_25px_25px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_35px_35px_rgba(46,91,255,0.1)]">
                                        <img
                                            src="/Capa_3D_do_ebook.png"
                                            alt="Estudos ambientais na era digital - Gilson Silva"
                                            className="w-full h-auto rounded-r-2xl rounded-l-sm transition-transform duration-500 hover:scale-[1.02]"
                                        />
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 lg:right-4 z-20 bg-[#E8F5E9] dark:bg-landing-emerald/10 border border-landing-vibrant/20 dark:border-landing-emerald/20 rounded-2xl p-6 shadow-xl dark:shadow-none max-w-[180px]">
                                        <div className="text-landing-vibrant text-5xl font-bold mb-1 font-display">10+</div>
                                        <div className="text-[11px] font-bold text-landing-navy dark:text-white/90 leading-tight uppercase tracking-wide">Anos de experiência em crises</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-landing-vibrant font-bold text-sm tracking-[0.2em] uppercase mb-6">Nossa Origem</span>
                                <h2 className="text-5xl md:text-6xl font-black italic text-landing-navy dark:text-white font-display leading-[1.1] mb-8">
                                    DO GERENCIAMENTO DE CRISES AO IMPACTO GLOBAL
                                </h2>
                                <div className="space-y-6 mb-12">
                                    <p className="text-lg text-landing-navy/60 dark:text-white/60 font-medium italic leading-relaxed">
                                        "O que a Envibase faz? A Envibase simplifica e automatiza seus estudos ambientais."
                                    </p>
                                    <p className="text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed text-lg">
                                        Nosso SGDA nativo na nuvem te entrega a tecnologia das grandes empresas para você ganhar tempo, produtividade e reconhecimento. Pare de imaginar e venha para a solução que não muda sua rotina, mas revoluciona seus resultados.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-12 border-t border-landing-navy/5 dark:border-white/5 pt-8">
                                    <div>
                                        <h4 className="font-bold text-landing-navy dark:text-white text-lg mb-2 font-display">SGDA Nativo</h4>
                                        <p className="text-sm text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed">Sistema de Gerenciamento de Dados Ambientais de última geração.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-landing-navy dark:text-white text-lg mb-2 font-display">Impacto Global</h4>
                                        <p className="text-sm text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed">Tecnologia escalável para qualquer tamanho de projeto em qualquer lugar.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <a
                                        href="https://docs.google.com/forms/d/e/1FAIpQLSdNDuyJW0FH3I-RxEfAW5wq38Q2aP6l94jO1aNNQ5LBB_pFSA/viewform"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-landing-vibrant text-landing-navy font-bold rounded-full px-10 py-5 flex items-center justify-center gap-3 shadow-xl shadow-landing-vibrant/20 dark:shadow-none hover:scale-105 transition-all text-sm uppercase tracking-wider"
                                    >
                                        <span className="material-symbols-outlined text-lg">download</span>
                                        BAIXAR E-BOOK GRATUITO
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="py-32 bg-landing-paper dark:bg-envibase-surface">
                    <div className="max-w-[1200px] mx-auto px-6 md:px-8 text-center">
                        <span className="text-landing-emerald font-bold text-sm tracking-[0.2em] uppercase mb-4 block">Transparência em Planos</span>
                        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-landing-navy dark:text-white font-display mb-6">Soluções para cada estágio</h2>
                        <p className="text-[#4A5568] dark:text-[#A0AEC0] text-lg max-w-3xl mx-auto mb-20">
                            Seja você um consultor independente ou uma grande organização, temos o plano ideal para sua jornada.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 items-stretch">
                            <div className="bg-white dark:bg-landing-navy/40 rounded-[40px] p-10 flex flex-col items-start text-left border border-black/5 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] dark:shadow-none">
                                <span className="text-landing-navy/50 dark:text-white/50 font-medium mb-2 text-lg">Individual (Grátis)</span>
                                <h3 className="text-5xl font-bold text-landing-navy dark:text-white font-display mb-8">Grátis</h3>

                                <div className="space-y-4 mb-12 flex-grow">
                                    {[
                                        "1 projeto ativo",
                                        "500MB de Cloud",
                                        "Relatórios básicos"
                                    ].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-[#4A5568] dark:text-[#A0AEC0]">
                                            <span className="material-symbols-outlined text-landing-emerald text-lg">check</span>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAccessPlatform}
                                    className="w-full py-4 rounded-full border border-black/10 dark:border-white/20 text-landing-navy dark:text-white font-semibold text-lg hover:bg-landing-navy hover:text-white dark:hover:bg-white dark:hover:text-landing-navy transition-all"
                                >
                                    Começar Agora
                                </button>
                            </div>

                            <div className="bg-landing-emerald text-white rounded-[40px] p-10 flex flex-col items-start text-left shadow-2xl relative z-10 md:transform md:scale-105">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-landing-emerald text-[11px] font-bold py-1.5 px-6 rounded-full tracking-widest uppercase shadow-md whitespace-nowrap">
                                    MAIS SUSTENTÁVEL
                                </div>
                                <span className="text-white/80 font-medium mb-2 text-lg">Profissional</span>
                                <div className="mb-8">
                                <h3 className="text-4xl font-bold font-display">Sob Consulta</h3>
                                </div>

                                <div className="space-y-4 mb-12 flex-grow w-full">
                                    {[
                                        "Projetos Ilimitados",
                                        "50GB Armazenamento",
                                        "Envibase AI Assistant",
                                        "Suporte Prioritário"
                                    ].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-white text-lg">check</span>
                                            <span className="font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => window.open('https://api.whatsapp.com/send?phone=5551989094777', '_blank')}
                                    className="w-full bg-white text-landing-emerald font-bold py-5 rounded-full text-lg shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform"
                                >
                                    Falar com Consultor
                                </button>
                            </div>

                            <div className="bg-white dark:bg-landing-navy/40 rounded-[40px] p-10 flex flex-col items-start text-left border border-black/5 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] dark:shadow-none">
                                <span className="text-landing-navy/50 dark:text-white/50 font-medium mb-2 text-lg">Corporativo</span>
                                <h3 className="text-4xl font-bold text-landing-navy dark:text-white font-display mb-8">Personalizado</h3>

                                <div className="space-y-4 mb-12 flex-grow">
                                    {[
                                        "Usuários Ilimitados",
                                        "Integração via API",
                                        "Gestão de Equipes"
                                    ].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-[#4A5568] dark:text-[#A0AEC0]">
                                            <span className="material-symbols-outlined text-landing-emerald text-lg">check</span>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full py-4 rounded-full border border-black/10 dark:border-white/20 text-landing-navy dark:text-white font-semibold text-lg hover:bg-landing-navy hover:text-white dark:hover:bg-white dark:hover:text-landing-navy transition-all">
                                    Falar com Consultor
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="py-24 bg-landing-paper dark:bg-envibase-surface border-t border-landing-navy/5 dark:border-white/5">
                    <div className="max-w-[1100px] mx-auto px-6 md:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-landing-navy dark:text-white font-display text-center mb-16">Perguntas Frequentes</h2>

                        <div className="grid md:grid-cols-2 gap-x-16 gap-y-2">
                            {faqs.map((faq, i) => (
                                <div key={i} className="cursor-pointer border-b border-landing-navy/5 dark:border-white/10 hover:border-landing-primary/40 dark:hover:border-landing-primary/40 transition-all flex flex-col px-2 group">
                                    <div
                                        className="py-5 flex justify-between items-center w-full"
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    >
                                        <h4 className="font-medium text-landing-navy dark:text-white/90 text-[17px] group-hover:text-landing-primary dark:group-hover:text-landing-primary transition-colors">
                                            {faq.q}
                                        </h4>
                                        <span
                                            className={`material-symbols-outlined transition-transform duration-300 ${activeFaq === i ? 'rotate-45 text-landing-primary' : 'text-landing-navy/30 dark:text-white/30 group-hover:text-landing-primary'}`}
                                        >
                                            add
                                        </span>
                                    </div>
                                    {activeFaq === i && (
                                        <div className="pb-5 text-[#4A5568] dark:text-[#A0AEC0] leading-relaxed text-[15px] animate-fade-in">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="pb-32 px-6 md:px-8 bg-landing-paper dark:bg-envibase-surface">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="bg-landing-darknavy rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden glow-cta shadow-2xl">
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-6xl font-bold text-white font-display mb-8 max-w-4xl mx-auto leading-tight">
                                    Pronto para elevar sua inteligência ambiental?
                                </h2>
                                <p className="text-white/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
                                    Junte-se a dezenas de especialistas que já otimizaram seus fluxos de dados com a plataforma líder em IHC Analytics.
                                </p>
                                <div className="flex flex-col items-center gap-6">
                                    <button onClick={handleAccessPlatform} className="bg-landing-vibrant text-landing-navy font-bold rounded-2xl px-12 py-6 text-lg hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,230,118,0.25)]">
                                        Testar a Plataforma
                                    </button>
                                    <p className="text-white/40 text-sm">Sem compromisso. Explore todos os recursos agora.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative bg-[#060A10] overflow-hidden">
                    {/* Decorative gradient separator */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00E676]/30 to-transparent" />

                    {/* Ambient glow orbs */}
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2E5BFF]/[0.03] rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00E676]/[0.03] rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-8 pt-20 pb-10">

                        {/* Main footer grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">

                            {/* Brand column */}
                            <div className="lg:col-span-4">
                                <div className="flex items-center gap-2.5 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#00E676]/20 to-[#2E5BFF]/20 rounded-xl flex items-center justify-center border border-white/[0.08]">
                                        <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}>eco</span>
                                    </div>
                                    <span className="font-bold tracking-tight text-xl font-display text-white">
                                        Envibase<span className="text-[#2E5BFF]">.</span>
                                    </span>
                                </div>

                                <p className="text-white/40 text-sm leading-relaxed max-w-[280px] mb-8">
                                    Plataforma de gestão e inteligência ambiental desenvolvida pelo Instituto Hidrocarboneto.
                                </p>

                                {/* Social links */}
                                <div className="flex items-center gap-3">
                                    <a href="#" aria-label="LinkedIn" className="group w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-[#00E676]/10 hover:border-[#00E676]/20 transition-all duration-300">
                                        <svg className="w-[18px] h-[18px] fill-white/50 group-hover:fill-[#00E676] transition-colors duration-300" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                    </a>
                                    <a href="#" aria-label="Instagram" className="group w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-[#00E676]/10 hover:border-[#00E676]/20 transition-all duration-300">
                                        <svg className="w-[18px] h-[18px] fill-white/50 group-hover:fill-[#00E676] transition-colors duration-300" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                    </a>
                                    <a href="mailto:contato@envibase.com.br" aria-label="Email" className="group w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-[#00E676]/10 hover:border-[#00E676]/20 transition-all duration-300">
                                        <span className="material-symbols-outlined text-[18px] text-white/50 group-hover:text-[#00E676] transition-colors duration-300">mail</span>
                                    </a>
                                </div>
                            </div>

                            {/* Navigation columns */}
                            <div className="lg:col-span-4 grid grid-cols-2 gap-10">
                                <div>
                                    <h5 className="font-bold text-white/80 mb-5 font-display tracking-wide text-xs uppercase">Plataforma</h5>
                                    <ul className="space-y-3.5">
                                        <li><a href="#layers" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Recursos</a></li>
                                        <li><a href="#pricing" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Preços</a></li>
                                        <li><button onClick={handleAccessPlatform} className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Acessar Plataforma</button></li>
                                        <li><a href="#" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Documentação</a></li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-bold text-white/80 mb-5 font-display tracking-wide text-xs uppercase">Empresa</h5>
                                    <ul className="space-y-3.5">
                                        <li><a href="#" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Sobre nós</a></li>
                                        <li><a href="#" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Termos de uso</a></li>
                                        <li><a href="#" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Privacidade</a></li>
                                        <li><a href="#" className="text-sm text-white/40 hover:text-[#00E676] transition-colors duration-200 flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00E676] transition-colors duration-200" />Contato</a></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Contact form */}
                            <div className="lg:col-span-4">
                                <h5 className="font-bold text-white/80 mb-5 font-display tracking-wide text-xs uppercase">Entre em contato</h5>
                                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="Seu nome" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:border-[#00E676]/40 focus:outline-none transition-all duration-300" />
                                        <input type="email" placeholder="Seu email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:border-[#00E676]/40 focus:outline-none transition-all duration-300" />
                                    </div>
                                    <input type="text" placeholder="Assunto" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:border-[#00E676]/40 focus:outline-none transition-all duration-300" />
                                    <textarea placeholder="Sua mensagem" rows={3} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:border-[#00E676]/40 focus:outline-none resize-none transition-all duration-300" />
                                    <button type="submit" className="w-full bg-gradient-to-r from-[#00E676] to-[#00C853] text-[#060A10] font-bold rounded-xl py-3.5 text-sm uppercase tracking-wider hover:shadow-[0_8px_30px_rgba(0,230,118,0.25)] hover:translate-y-[-1px] active:translate-y-0 transition-all duration-300 font-display">
                                        Enviar Mensagem
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="mt-16 pt-8 border-t border-white/[0.06]">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-5">
                                <div className="flex items-center gap-2 text-white/25">
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>eco</span>
                                    <p className="text-[11px] font-medium tracking-[0.15em] uppercase">
                                        © {new Date().getFullYear()} Envibase · Todos os direitos reservados
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-[11px] text-white/20 font-medium tracking-[0.12em] uppercase flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]/40" />
                                        Sustentabilidade em primeiro lugar
                                    </span>
                                    <span className="hidden md:block w-px h-3 bg-white/10" />
                                    <span className="text-[11px] text-white/20 font-medium tracking-[0.12em] uppercase">
                                        IHC Research Labs
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Floating Helper */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
                {showAIChat && (
                    <div className="mb-4 w-[380px] h-[600px] pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500">
                        <MapCommandProvider onExecuteCommands={() => { }}>
                            <ChatBot 
                                stationData={[]} 
                                onClose={() => setShowAIChat(false)} 
                            />
                        </MapCommandProvider>
                    </div>
                )}

                {!showAIChat && (
                    <div className="bg-white dark:bg-landing-navy/90 rounded-2xl rounded-br-sm shadow-xl p-4 border border-landing-navy/10 dark:border-white/20 max-w-[280px] pointer-events-auto flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-500 mb-2">
                        <div className="w-9 h-9 bg-landing-navy dark:bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-inner">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 18" }}>eco</span>
                        </div>
                        <p className="text-[14px] text-landing-navy dark:text-white/90 font-medium leading-snug mt-1">Como podemos ajudar no seu onboarding?</p>
                    </div>
                )}
                <button
                    onClick={() => setShowAIChat(!showAIChat)}
                    className="w-14 h-14 bg-landing-navy dark:bg-landing-navy/80 rounded-full shadow-lg dark:shadow-none flex items-center justify-center text-white hover:bg-landing-primary dark:hover:bg-landing-primary transition-all pointer-events-auto border-2 border-white dark:border-white/20 focus:outline-none active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl">{showAIChat ? 'close' : 'chat'}</span>
                </button>
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
                onSuccess={() => navigate('/platform')} 
            />
        </div>
    );
};

export default LandingPage;
