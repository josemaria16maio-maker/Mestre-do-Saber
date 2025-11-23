import React, { useState, useEffect, useRef } from 'react';
import { generateQuestions } from './services/geminiService';
import { audioManager } from './services/audioService';
import { GameState, Question, PrizeLevel, Lifelines } from './types';
import HostAvatar from './components/HostAvatar';
import PrizeLadder from './components/PrizeLadder';
import Logo from './components/Logo';

// Configuração de Prêmios (Score Virtual)
const PRIZES: PrizeLevel[] = [
  { level: 1, value: 1000, stopValue: 0, errorValue: 0 },
  { level: 2, value: 2000, stopValue: 1000, errorValue: 500 },
  { level: 3, value: 3000, stopValue: 2000, errorValue: 1000 },
  { level: 4, value: 4000, stopValue: 3000, errorValue: 1500 },
  { level: 5, value: 5000, stopValue: 4000, errorValue: 2000 },
  { level: 6, value: 10000, stopValue: 5000, errorValue: 2500 },
  { level: 7, value: 20000, stopValue: 10000, errorValue: 5000 },
  { level: 8, value: 30000, stopValue: 20000, errorValue: 10000 },
  { level: 9, value: 40000, stopValue: 30000, errorValue: 15000 },
  { level: 10, value: 50000, stopValue: 40000, errorValue: 20000 },
  { level: 11, value: 100000, stopValue: 50000, errorValue: 25000 },
  { level: 12, value: 200000, stopValue: 100000, errorValue: 50000 },
  { level: 13, value: 300000, stopValue: 200000, errorValue: 100000 },
  { level: 14, value: 400000, stopValue: 300000, errorValue: 150000 },
  { level: 15, value: 500000, stopValue: 400000, errorValue: 200000 },
  { level: 16, value: 1000000, stopValue: 500000, errorValue: 0 },
];

const App: React.FC = () => {
  // --- Estado do Jogo ---
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lifelines, setLifelines] = useState<Lifelines>({
    quantumLeap: 3,
    fiftyFifty: true,
    oracleAi: true,
    globalConsensus: true,
  });
  const [optionsHidden, setOptionsHidden] = useState<number[]>([]);
  const [hostSpeaking, setHostSpeaking] = useState(false);
  const [finalMessage, setFinalMessage] = useState("");
  const [wonAmount, setWonAmount] = useState(0);
  
  // Instalação / Modais
  const [showTerms, setShowTerms] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);

  const speakingCheckInterval = useRef<number | null>(null);

  // --- Inicialização ---

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // Removemos o bloqueio de botão direito para ficar mais "user friendly"
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleStartClick = () => {
    setShowTerms(true);
  };

  const confirmTermsAndStart = async () => {
    setShowTerms(false);
    startGame();
  };

  const startGame = async () => {
    setGameState(GameState.LOADING);
    audioManager.resumeContext();
    
    // Resetar estado
    const generated = await generateQuestions();
    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setLifelines({ quantumLeap: 3, fiftyFifty: true, oracleAi: true, globalConsensus: true });
    setOptionsHidden([]);
    setLastActionTime(Date.now());
    
    setGameState(GameState.PLAYING);
    playRoundIntro(generated[0], 0);
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      setShowInstallInstructions(true);
    }
  };

  // --- Lógica do Jogo ---

  const currentPrize = PRIZES[currentQuestionIndex];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    speakingCheckInterval.current = window.setInterval(() => {
      setHostSpeaking(audioManager.isSpeaking());
    }, 100);
    return () => {
      if (speakingCheckInterval.current) clearInterval(speakingCheckInterval.current);
    };
  }, []);

  const speak = (text: string, onEnd?: () => void) => {
    audioManager.speak(text, onEnd);
  };

  const playRoundIntro = (q: Question, idx: number) => {
    audioManager.playIntro();
    setOptionsHidden([]);
    setSelectedOption(null);
    setLastActionTime(Date.now());
    
    const prizeVal = PRIZES[idx].value.toLocaleString('pt-BR');
    const textToRead = `Pergunta número ${idx + 1}. Valendo ${prizeVal} pontos. ${q.questionText}`;
    
    // Pequeno delay para a UI montar
    setTimeout(() => {
      speak(textToRead);
    }, 1000);
  };

  const handleSelectOption = (index: number) => {
    if (Date.now() - lastActionTime < 500) return; 
    
    if (gameState !== GameState.PLAYING || hostSpeaking) return;
    if (optionsHidden.includes(index)) return;

    audioManager.playSelect();
    setSelectedOption(index);
    
    speak("Você tem certeza dessa escolha?", () => {
      setGameState(GameState.CONFIRMATION);
    });
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    setGameState(GameState.RESULT_REVEAL);
    audioManager.playSuspense();
    speak("Vamos conferir...", () => {
       verifyAnswer();
    });
  };

  const verifyAnswer = () => {
    const correctInfo = currentQuestion.correctAnswerIndex;
    
    setTimeout(() => {
      if (selectedOption === correctInfo) {
        audioManager.playCorrect();
        const nextIndex = currentQuestionIndex + 1;
        
        if (nextIndex >= questions.length) {
          setWonAmount(1000000);
          setFinalMessage("VOCÊ É UM MESTRE DO SABER!");
          setGameState(GameState.VICTORY);
          speak("Espetacular! Você completou todos os desafios!");
        } else {
          speak("Certa resposta! Vamos para o próximo nível.", () => {
             setCurrentQuestionIndex(nextIndex);
             setGameState(GameState.PLAYING);
             playRoundIntro(questions[nextIndex], nextIndex);
          });
        }
      } else {
        audioManager.playWrong();
        const lossValue = currentPrize.errorValue;
        setWonAmount(lossValue);
        setFinalMessage(`Não foi dessa vez. Sua pontuação final: ${lossValue.toLocaleString('pt-BR')}`);
        setGameState(GameState.GAME_OVER);
        speak(`Que pena, resposta incorreta. A certa era a letra ${getLetter(correctInfo)}. Tente novamente!`);
      }
    }, 2000);
  };

  const handleStop = () => {
    if (gameState !== GameState.PLAYING) return;
    audioManager.cancelSpeech();
    
    const stopVal = currentPrize.stopValue;
    setWonAmount(stopVal);
    setFinalMessage(`Jogo encerrado. Você garantiu: ${stopVal.toLocaleString('pt-BR')}`);
    setGameState(GameState.GAME_OVER);
    speak(`Você decidiu parar. Parabéns pela pontuação conquistada!`);
  };

  // --- Habilidades (Lifelines) ---

  const useQuantumLeap = () => { // Antigo Pular
    if (gameState !== GameState.PLAYING || lifelines.quantumLeap <= 0) return;
    
    setLifelines(prev => ({ ...prev, quantumLeap: prev.quantumLeap - 1 }));
    speak("Trocando a pergunta!");
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
       setCurrentQuestionIndex(nextIndex);
       playRoundIntro(questions[nextIndex], nextIndex);
    }
  };

  const useFiftyFifty = () => { // Antigo Cartas
    if (gameState !== GameState.PLAYING || !lifelines.fiftyFifty) return;
    
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
    speak("Removendo duas opções incorretas.");
    
    const correct = currentQuestion.correctAnswerIndex;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correct);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    setOptionsHidden([shuffled[0], shuffled[1]]);
  };

  const useOracle = () => { // Antigo Universitários
    if (gameState !== GameState.PLAYING || !lifelines.oracleAi) return;
    setLifelines(prev => ({ ...prev, oracleAi: false }));
    
    const correct = currentQuestion.correctAnswerIndex;
    const isHelpful = Math.random() > 0.3; // IA tem 70% de chance de acertar
    const suggestion = isHelpful ? correct : (correct + 1) % 4;
    
    speak(`O Oráculo sugere que a resposta pode ser a letra ${getLetter(suggestion)}`);
  };

  const useConsensus = () => { // Antigo Platéia
    if (gameState !== GameState.PLAYING || !lifelines.globalConsensus) return;
    setLifelines(prev => ({ ...prev, globalConsensus: false }));
    
    const correct = currentQuestion.correctAnswerIndex;
    const votes = [0,0,0,0];
    votes[correct] = 40 + Math.floor(Math.random() * 20);
    let remaining = 100 - votes[correct];
    
    for(let i=0; i<4; i++) {
        if (i !== correct) {
            if (i === 3 && correct !== 3) { votes[i] = remaining; }
            else {
                const share = Math.floor(Math.random() * remaining);
                votes[i] = share;
                remaining -= share;
            }
        }
    }
    
    const voteString = `A: ${votes[0]}%, B: ${votes[1]}%, C: ${votes[2]}%, D: ${votes[3]}%`;
    speak(`Resultado da votação global: ${voteString}`);
    alert(`VOTAÇÃO GLOBAL:\n${voteString}`);
  };


  const getLetter = (i: number) => ["A", "B", "C", "D"][i];

  // --- Renders ---

  if (gameState === GameState.LOADING) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 scanline-effect">
        <Logo variant="simple" className="animate-pulse mb-8" />
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 animate-[width_2s_ease-in-out_infinite] w-1/2"></div>
        </div>
        <h2 className="text-xl text-violet-400 font-bold mt-4 animate-pulse brand-font">PREPARANDO DESAFIOS...</h2>
        <p className="text-xs text-slate-600 mt-2 font-mono">SINCRONIZANDO BANCO DE DADOS DE IA</p>
      </div>
    );
  }

  // LANDING PAGE
  if (gameState === GameState.WELCOME) {
    return (
      <div className="min-h-screen bg-black text-white overflow-y-auto selection:bg-violet-500 selection:text-white pb-20 md:pb-0">
        
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-violet-900/30 py-3 px-6 flex justify-between items-center">
          <Logo />
          <div className="flex gap-4">
            <button onClick={handleInstallClick} className="hidden md:block text-slate-400 hover:text-white font-bold text-sm transition-colors uppercase tracking-wider">
              [Baixar Jogo]
            </button>
            <button 
              onClick={handleStartClick}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded border border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)] uppercase tracking-wide transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.8)]"
            >
              Jogar Agora
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative min-h-screen flex flex-col items-center justify-center text-center p-6 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
          <div className="absolute inset-0 scanline-effect opacity-20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto mt-16">
            <div className="inline-block border border-violet-500/50 bg-violet-900/10 rounded-full px-4 py-1 mb-8 animate-fade-in-up backdrop-blur-sm">
               <span className="text-violet-300 text-xs font-bold tracking-[0.2em] uppercase">Nova Temporada Disponível</span>
            </div>
            
            <div className="mb-12 animate-fade-in-up delay-100 flex justify-center">
               <Logo variant="large" />
            </div>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200 font-light font-sans">
              Entre na <strong className="text-white">Arena Mental</strong>. 
              Enfrente 16 níveis de perguntas geradas por Inteligência Artificial.
              Prove que você tem o <span className="text-violet-400 font-bold">conhecimento supremo</span>.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
              <button 
                onClick={handleStartClick}
                className="w-full md:w-auto bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xl py-4 px-12 rounded border border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] transform transition hover:scale-105 active:scale-95 uppercase tracking-widest brand-font"
              >
                COMEÇAR JOGO
              </button>
              <button 
                onClick={handleInstallClick}
                className="w-full md:w-auto bg-transparent border border-slate-700 hover:border-white text-slate-300 hover:text-white font-bold text-lg py-4 px-8 rounded transition-colors flex items-center justify-center gap-2 group font-mono"
              >
                INSTALAR APP
              </button>
            </div>
            
            <div className="mt-8 text-xs text-slate-600 font-mono">
                DIFICULDADE: ADAPTATIVA • IA: ONLINE • RANKING: GLOBAL
            </div>
          </div>
        </header>

        {/* Features */}
        <section className="py-20 px-6 bg-slate-950 border-t border-slate-900">
           <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                 {/* Card 1 */}
                 <div className="bg-black/50 p-8 rounded border border-slate-800 hover:border-violet-500/50 transition-colors">
                    <h3 className="text-xl font-bold mb-3 text-violet-400 brand-font">INTELIGÊNCIA ARTIFICIAL</h3>
                    <p className="text-slate-400 text-sm">O sistema cria perguntas novas a cada rodada. Você nunca jogará o mesmo jogo duas vezes.</p>
                 </div>
                 {/* Card 2 */}
                 <div className="bg-black/50 p-8 rounded border border-slate-800 hover:border-blue-500/50 transition-colors">
                    <h3 className="text-xl font-bold mb-3 text-blue-400 brand-font">ESTRATÉGIA PURA</h3>
                    <p className="text-slate-400 text-sm">Use suas habilidades especiais como 'Salto Quântico' e 'Oráculo' para superar os níveis mais difíceis.</p>
                 </div>
                 {/* Card 3 */}
                 <div className="bg-black/50 p-8 rounded border border-slate-800 hover:border-emerald-500/50 transition-colors">
                    <h3 className="text-xl font-bold mb-3 text-emerald-400 brand-font">NÍVEL MESTRE</h3>
                    <p className="text-slate-400 text-sm">Comece como Iniciante e suba na classificação até alcançar o título lendário de Mestre.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="bg-black py-12 text-center border-t border-slate-900 pb-24 md:pb-12">
           <p className="text-slate-600 text-xs font-mono tracking-wide">© 2025 MESTRE SABER GAMES.</p>
           <p className="text-slate-800 text-[10px] mt-2 font-mono">JOGUE COM MODERAÇÃO. DIVIRTA-SE.</p>
        </footer>

        {/* Sticky Install */}
        <div className="fixed bottom-6 right-6 z-40">
            <button 
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-emerald-600/90 backdrop-blur hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400 transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="font-mono text-xs uppercase">Instalar App</span>
            </button>
        </div>

        {/* TERMS MODAL (Agora Regras do Jogo) */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <div className="bg-slate-900 border border-violet-500/30 rounded shadow-[0_0_30px_rgba(139,92,246,0.2)] max-w-lg w-full">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-violet-400 brand-font">Regras do Desafio</h3>
              </div>
              <div className="p-6 space-y-4 text-slate-400 text-sm font-mono max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p>1. O objetivo é responder corretamente a 16 perguntas consecutivas.</p>
                <p>2. Os "pontos" são virtuais e servem para medir seu ranking no jogo.</p>
                <p>3. Você pode parar a qualquer momento e garantir sua pontuação atual.</p>
                <p>4. Divirta-se e desafie seus limites intelectuais!</p>
              </div>
              <div className="p-6 border-t border-slate-800 flex gap-4">
                 <button onClick={() => setShowTerms(false)} className="flex-1 py-3 text-slate-400 hover:text-white font-mono text-xs uppercase">Voltar</button>
                 <button onClick={confirmTermsAndStart} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-widest text-xs rounded shadow-lg">Começar</button>
              </div>
            </div>
          </div>
        )}

        {/* Install Instructions */}
        {showInstallInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
             <div className="bg-slate-900 border border-slate-700 rounded p-8 max-w-sm w-full text-center">
                <div className="text-violet-500 mb-4 mx-auto w-12 h-12 border border-violet-500 rounded flex items-center justify-center text-xl font-bold">!</div>
                <h3 className="text-white font-bold mb-2 brand-font">Instale para melhor experiência</h3>
                <p className="text-slate-400 text-sm mb-6">Instalar o jogo permite jogar em tela cheia e carregar mais rápido.</p>
                {isIOS ? (
                   <p className="text-xs text-slate-500 mb-4 bg-slate-800 p-2 rounded">iOS: Toque em Compartilhar &gt; Adicionar à Tela de Início.</p>
                ) : (
                   <p className="text-xs text-slate-500 mb-4 bg-slate-800 p-2 rounded">Abra o menu do navegador &gt; Instalar Aplicativo.</p>
                )}
                <button onClick={() => setShowInstallInstructions(false)} className="w-full bg-slate-700 text-white py-2 rounded font-mono text-xs">FECHAR</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // GAME OVER / VICTORY
  if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 scanline-effect">
        <div className="text-center p-8 bg-slate-900/80 rounded border border-slate-700 max-w-2xl w-full backdrop-blur-md">
           <HostAvatar isSpeaking={hostSpeaking} emotion={gameState === GameState.VICTORY ? 'happy' : 'serious'} />
           <h2 className={`text-4xl font-bold mb-4 brand-font ${gameState === GameState.VICTORY ? 'text-yellow-400' : 'text-blue-500'}`}>
             {gameState === GameState.VICTORY ? 'VITÓRIA LENDÁRIA!' : 'FIM DE JOGO'}
           </h2>
           <p className="text-xl text-slate-300 mb-8 font-mono">{finalMessage}</p>
           <div className="text-5xl font-black text-white mb-8 neon-text">
             SCORE: {wonAmount.toLocaleString('pt-BR')}
           </div>
           <button 
             onClick={() => setGameState(GameState.WELCOME)}
             className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded border border-slate-500 font-mono"
           >
             JOGAR NOVAMENTE
           </button>
        </div>
      </div>
    );
  }

  // JOGO ATIVO
  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Sidebar Score */}
      <div className="hidden lg:flex lg:w-1/4 p-4 flex-col justify-center bg-slate-950 border-r border-slate-800">
         <div className="mb-6 text-center">
            <div className="text-xs text-violet-400 uppercase tracking-widest font-mono mb-2">Pontuação Atual</div>
            <div className="text-4xl font-bold text-white neon-text">{currentPrize.value.toLocaleString('pt-BR')}</div>
         </div>
         <PrizeLadder currentLevel={currentQuestionIndex} prizes={PRIZES} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative bg-[url('https://img.freepik.com/free-vector/dark-hexagonal-background-with-gradient-color_79603-1409.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/80"></div>
        
        {/* Mobile Top Bar */}
        <div className="lg:hidden relative z-10 bg-black/90 p-4 flex justify-between items-center border-b border-slate-800">
             <span className="text-violet-400 font-bold font-mono">SCORE: {currentPrize.value.toLocaleString('pt-BR')}</span>
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] text-slate-500 uppercase">Ao Vivo</span>
             </div>
        </div>

        {/* Avatar/Host */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 min-h-[180px]">
            <HostAvatar isSpeaking={hostSpeaking} emotion={gameState === GameState.RESULT_REVEAL ? 'serious' : 'neutral'} />
        </div>

        {/* Question Box */}
        <div className="relative z-10 mx-4 mb-6">
            <div className="bg-slate-900/80 p-6 rounded border-l-4 border-violet-500 shadow-lg backdrop-blur text-center min-h-[120px] flex items-center justify-center">
                <h2 className="text-lg md:text-2xl font-medium leading-relaxed text-slate-100">
                    {currentQuestion ? currentQuestion.questionText : "Carregando pergunta..."}
                </h2>
            </div>
        </div>

        {/* Options */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pb-24 md:pb-4">
            {currentQuestion && currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isHidden = optionsHidden.includes(idx);
                
                let btnStyle = "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-violet-500 hover:text-white";
                if (isSelected) btnStyle = "bg-violet-900/90 border-violet-400 text-white neon-border";
                
                if (isHidden) return <div key={idx} className="h-14 md:h-16 invisible"></div>;

                return (
                    <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={gameState !== GameState.PLAYING || hostSpeaking}
                        className={`
                            relative group overflow-hidden rounded border p-4 flex items-center transition-all active:scale-95
                            ${btnStyle}
                            ${gameState !== GameState.PLAYING ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className={`
                            w-8 h-8 rounded flex items-center justify-center mr-4 shrink-0 font-bold font-mono
                            ${isSelected ? 'bg-white text-violet-900' : 'bg-slate-800 text-slate-500'}
                        `}>
                            {getLetter(idx)}
                        </div>
                        <span className="text-left font-medium text-sm md:text-base truncate w-full">{opt}</span>
                    </button>
                )
            })}
        </div>

        {/* Lifelines Bar */}
        <div className="relative z-10 bg-black border-t border-slate-800 p-3">
            <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                    <button onClick={useQuantumLeap} disabled={gameState !== GameState.PLAYING || lifelines.quantumLeap <= 0} className={`lifeline-btn ${lifelines.quantumLeap <= 0 ? 'opacity-30' : ''}`}>
                        SALTO ({lifelines.quantumLeap})
                    </button>
                    <button onClick={useFiftyFifty} disabled={gameState !== GameState.PLAYING || !lifelines.fiftyFifty} className={`lifeline-btn ${!lifelines.fiftyFifty ? 'opacity-30' : ''}`}>
                        50/50
                    </button>
                    <button onClick={useOracle} disabled={gameState !== GameState.PLAYING || !lifelines.oracleAi} className={`lifeline-btn ${!lifelines.oracleAi ? 'opacity-30' : ''}`}>
                        ORÁCULO
                    </button>
                    <button onClick={useConsensus} disabled={gameState !== GameState.PLAYING || !lifelines.globalConsensus} className={`lifeline-btn ${!lifelines.globalConsensus ? 'opacity-30' : ''}`}>
                        CONSENSO
                    </button>
                </div>
                
                <div className="flex gap-2 ml-auto w-full md:w-auto justify-end mt-2 md:mt-0">
                    <button 
                        onClick={handleStop}
                        disabled={gameState !== GameState.PLAYING}
                        className="px-4 py-2 rounded bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 font-bold text-xs uppercase tracking-wider"
                    >
                        PARAR
                    </button>
                    {gameState === GameState.CONFIRMATION && (
                        <button 
                            onClick={handleConfirm}
                            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"
                        >
                            CONFIRMAR
                        </button>
                    )}
                </div>
            </div>
            <style>{`
                .lifeline-btn {
                    padding: 8px 12px;
                    border-radius: 4px;
                    background: #1e1e2e;
                    border: 1px solid #3f3f46;
                    color: #a1a1aa;
                    font-size: 10px;
                    font-weight: bold;
                    font-family: monospace;
                    text-transform: uppercase;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .lifeline-btn:hover:not(:disabled) {
                    background: #2e2e3e;
                    color: white;
                    border-color: #8b5cf6;
                }
            `}</style>
        </div>

      </div>
    </div>
  );
};

export default App;