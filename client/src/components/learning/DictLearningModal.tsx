import React, { useState, useEffect } from "react";
import type { DictionaryWordAssociation } from "../../types/dictionary";

interface DictLearningModalProps {
  associations: DictionaryWordAssociation[];
  isOpen: boolean;
  onClose: () => void;
  dictionaryName: string;
}

const DictLearningModal: React.FC<DictLearningModalProps> = ({
  associations,
  isOpen,
  onClose,
  dictionaryName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentAssoc = associations[currentIndex];
  const word = currentAssoc?.word;

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentIndex < associations.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const playPronunciation = () => {
    if (!word?.word || isPlaying) return;
    setIsPlaying(true);

    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = "en-US";
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      } else if (word.pronunciation1) {
        const audio = new Audio(word.pronunciation1);
        audio
          .play()
          .then(() => {
            audio.onended = () => setIsPlaying(false);
          })
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("播放失败:", error);
      setIsPlaying(false);
    }
  };

  if (!isOpen || !currentAssoc) return null;

  const progressPercentage = ((currentIndex + 1) / associations.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 transition-all duration-500 overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-yellow-200/20 rounded-full blur-[120px] animate-bounce-slow"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="group bg-white/20 hover:bg-white/40 backdrop-blur-xl p-3 rounded-2xl text-white transition-all transform hover:scale-110 active:scale-95 border border-white/30 shadow-xl"
            title="退出学习"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="text-white drop-shadow-md">
            <h1 className="text-2xl font-black tracking-tight">
              {dictionaryName}
            </h1>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] pl-0.5">
              Keep learning, keep growing
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/30 shadow-xl flex items-center gap-4">
          <div className="h-2.5 w-32 md:w-48 bg-white/30 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(253,224,71,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-white font-black text-sm tracking-tighter">
            {currentIndex + 1} <span className="opacity-50">/</span>{" "}
            {associations.length}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`relative w-full max-w-6xl px-4 md:px-8 transition-all duration-500 transform ${
          isAnimating
            ? "opacity-0 scale-95 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Floating Decorations */}
        <div className="absolute -top-12 -left-4 w-20 h-20 bg-yellow-300 rounded-full flex items-center justify-center text-3xl animate-bounce-slow shadow-2xl z-20 border-4 border-white rotate-12 hidden md:flex">
          ✨
        </div>
        <div className="absolute -bottom-8 -right-4 w-24 h-24 bg-pink-400 rounded-[32px] flex items-center justify-center text-4xl rotate-12 shadow-2xl z-20 border-4 border-white animate-pulse-slow backdrop-blur-sm hidden md:flex">
          �
        </div>

        {/* The Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-[40px] md:rounded-[60px] shadow-[0_40px_120px_rgba(0,0,0,0.2)] border-[8px] md:border-[16px] border-white flex flex-col md:flex-row min-h-[500px] md:h-[650px] overflow-hidden group">
          {/* Left Column: Visual & Word */}
          <div className="w-full md:w-5/12 p-8 md:p-12 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 border-b-2 md:border-b-0 md:border-r-2 border-slate-100">
            <div className="text-center w-full mb-8">
              <span className="bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block">
                Discovery Card
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight mb-4 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                {word?.word}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl md:text-2xl font-mono text-slate-400 font-bold bg-white px-4 py-1 rounded-xl shadow-sm border border-slate-100">
                  {word?.phonetic}
                </span>
                <button
                  onClick={playPronunciation}
                  disabled={isPlaying}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-xl transform transition-all active:scale-90 hover:rotate-3 ${
                    isPlaying
                      ? "bg-indigo-500 text-white animate-pulse"
                      : "bg-yellow-400 text-yellow-900 hover:bg-yellow-300 shadow-yellow-200"
                  }`}
                >
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>
              </div>

              {/* Pronunciation Rules */}
              {word?.pronunciationRules &&
                word.pronunciationRules.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {word.pronunciationRules.map((rule) => (
                      <span
                        key={rule.id}
                        className="bg-white text-indigo-500 text-[10px] md:text-[11px] font-black px-3 py-1 rounded-lg border-2 border-indigo-50 shadow-sm"
                      >
                        {rule.letterCombination}{" "}
                        <span className="opacity-30 mx-1">→</span>{" "}
                        {rule.pronunciation}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* Image Area */}
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-[40px] border-4 border-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)] flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
              {word?.hasImage && word.imageValue ? (
                word.imageType === "emoji" ? (
                  <span className="text-8xl md:text-9xl animate-bounce-slow drop-shadow-xl select-none">
                    {word.imageValue}
                  </span>
                ) : word.imageType === "iconfont" ? (
                  <i
                    className={`iconfont ${word.imageValue} text-[150px] md:text-[180px] text-indigo-400 drop-shadow-lg`}
                  ></i>
                ) : (
                  <img
                    src={word.imageValue}
                    alt={word.word}
                    className="w-full h-full object-contain p-6 transform group-hover:scale-110 transition-transform duration-700"
                  />
                )
              ) : (
                <div className="flex flex-col items-center opacity-20">
                  <span className="text-8xl mb-2">📖</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Knowledge
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col bg-white h-full relative">
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8 py-2 md:py-4">
              {/* Meaning Section */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm">🏮</span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    中文释义
                  </h3>
                </div>
                <p className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">
                  {word?.meaning}
                </p>
                <div className="absolute -left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 to-transparent rounded-full hidden md:block"></div>
              </div>

              {/* Sentence Section */}
              {word?.sentence && (
                <div className="bg-emerald-50/50 rounded-[30px] md:rounded-[40px] p-6 md:p-8 border-2 border-emerald-100/50 relative overflow-hidden group/sentence">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover/sentence:translate-x-2 transition-transform">
                    <svg
                      className="w-20 h-20 md:w-24 md:h-24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 17h3.358c.242 0 .43-.223.385-.46l-.372-1.956c-.053-.284.14-.543.424-.555 1.25-.05 2.158-1.258 2.204-2.528.026-.693-.564-1.251-1.257-1.251h-4.742c-.693 0-1.257.564-1.257 1.257v1.25c0 2.333 1.222 4.243 3.017 4.243zM6 17h3.358c.242 0 .43-.223.385-.46l-.372-1.956c-.053-.284.14-.543.424-.555 1.25-.05 2.158-1.258 2.204-2.528.026-.693-.564-1.251-1.257-1.251h-4.742c-.693 0-1.257.564-1.257 1.257v1.25c0 2.333 1.222 4.243 3.017 4.243z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm">🌱</span>
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      趣味例句
                    </h3>
                  </div>
                  <p className="text-lg md:text-xl text-slate-700 italic font-medium leading-relaxed relative z-10">
                    "{word.sentence}"
                  </p>
                </div>
              )}

              {/* Notes Section */}
              {(word?.notes || currentAssoc?.notes) && (
                <div className="bg-amber-50/50 rounded-[30px] md:rounded-[40px] p-6 md:p-8 border-2 border-amber-100/50">
                  <div className="flex items-center gap-3 mb-4 text-amber-500 font-black">
                    <span className="text-sm">💡</span>
                    <h3 className="text-[10px] uppercase tracking-widest">
                      记忆锦囊 & 笔记
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {word?.notes && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1.5 h-auto bg-amber-200 rounded-full"></div>
                        <p className="text-sm md:text-md text-slate-600 leading-relaxed font-bold">
                          {word.notes}
                        </p>
                      </div>
                    )}
                    {currentAssoc?.notes && (
                      <div className="flex gap-3 bg-white/60 p-4 rounded-2xl border border-amber-100/80">
                        <span className="text-lg">📝</span>
                        <p className="text-xs md:text-sm text-amber-800 leading-relaxed font-black">
                          {currentAssoc.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content Bottom Navigation (Inside Card) */}
            <div className="pt-6 md:pt-8 flex items-center justify-between border-t border-slate-50 md:border-t-2 mt-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-20 font-black"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
                <span className="text-sm md:text-base">上一个</span>
              </button>

              <button
                onClick={handleNext}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[30px] text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200 flex items-center gap-2 md:gap-3 font-black"
              >
                <span className="text-base md:text-lg">
                  {currentIndex === associations.length - 1
                    ? "完成学习！"
                    : "下一个"}
                </span>
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M14 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorative Text */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none select-none -z-10 overflow-hidden">
        <h2 className="text-white/10 font-black text-[15vw] uppercase tracking-tighter leading-none opacity-40">
          Amazing English
        </h2>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-15px) rotate(15deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) rotate(12deg); opacity: 0.8; }
          50% { transform: scale(1.05) rotate(10deg); opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DictLearningModal;
