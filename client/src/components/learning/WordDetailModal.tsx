import React from 'react'
import type { WordPlanWord } from '../../types/wordPlan'

interface WordDetailModalProps {
    word: WordPlanWord
    onClose: () => void
    onNext: () => void
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, onClose, onNext }) => {
    const w = word.word

    if (!w) return null

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-rose-500">
                            <div className="p-2 bg-rose-50 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold">回答错误</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Word Header Section */}
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{w.word}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg text-slate-500 font-medium font-mono">{w.phonetic}</span>
                                    {w.pronunciation1 && (
                                        <button
                                            onClick={() => {
                                                const audio = new Audio(w.pronunciation1!)
                                                audio.play().catch(console.error)
                                            }}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            title="播放发音"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {w.hasImage && w.imageValue && (
                                <div className="flex-shrink-0 w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                    {w.imageType === 'emoji' ? (
                                        <span className="text-5xl">{w.imageValue}</span>
                                    ) : w.imageType === 'url' ? (
                                        <img src={w.imageValue} alt={w.word} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">📚</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Meaning Section */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-sm font-semibold uppercase tracking-wider">释义</h3>
                            </div>
                            <p className="text-xl text-slate-800 font-medium leading-relaxed">{w.meaning}</p>
                        </div>

                        {/* Example Sentence */}
                        {w.sentence && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">例句</h3>
                                </div>
                                <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50">
                                    <p className="text-lg text-slate-700 italic leading-relaxed font-serif">
                                        "{w.sentence}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {w.notes && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">笔记</h3>
                                </div>
                                <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100/50">
                                    <p className="text-slate-700 leading-relaxed">{w.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Pronunciation Rules */}
                        {w.pronunciationRules && w.pronunciationRules.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">发音规则</h3>
                                </div>
                                <div className="grid gap-3">
                                    {w.pronunciationRules.map((rule: any) => (
                                        <div key={rule.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-lg text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                                                    {rule.letterCombination}
                                                </span>
                                                <span className="text-slate-500 font-medium">
                                                    [{rule.pronunciation}]
                                                </span>
                                            </div>
                                            <span className="text-sm text-slate-600">{rule.ruleDescription}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button
                            onClick={onNext}
                            className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <span>继续学习</span>
                            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WordDetailModal
