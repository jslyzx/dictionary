import React from "react";
import type { WordPlanWord } from "../../types/wordPlan";

interface WordDetailModalProps {
  word: WordPlanWord;
  onClose: () => void;
  onNext: () => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  onClose,
  onNext,
}) => {
  const w = word.word;
  if (!w) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up border border-white/20">
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                回答错误
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <h2 className="text-4xl font-bold mb-2 tracking-tight">{w.word}</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg opacity-90">{w.phonetic}</span>
              {w.pronunciation1 && (
                <button
                  onClick={() => {
                    const audio = new Audio(w.pronunciation1!);
                    audio.play().catch(console.error);
                  }}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Meaning */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              释义
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xl text-slate-800 font-medium">{w.meaning}</p>
            </div>
          </div>

          {/* Example Sentence */}
          {w.sentence && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                例句
              </h3>
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                <p className="text-slate-700 italic">"{w.sentence}"</p>
              </div>
            </div>
          )}

          {/* Notes (Optional) */}
          {w.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                笔记
              </h3>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                <p className="text-slate-600 text-sm">{w.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onNext}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            继续学习 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordDetailModal;
