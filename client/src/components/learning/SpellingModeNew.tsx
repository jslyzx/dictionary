import { useState, useEffect } from "react";
import type { Word } from "../../types/word";
import type { WordPlanWord } from "../../types/wordPlan";

interface SpellingModeProps {
  word: Word | WordPlanWord;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  onSkip?: () => void;
  progress: { current: number; total: number; percentage: number };
  settings?: any;
  stats?: any;
  feedback?: any;
  onEnd?: () => void;
}

const SpellingMode = ({ word, onAnswer }: SpellingModeProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);

  // Robustly extract the effective word object.
  // If word is a nested wrapper (e.g. WordPlanWord), word.word will be an object.
  // If word is a flat Word object, word.word will be a string.
  let effectiveWord: any = word;
  if (word && "word" in word && typeof word.word === "object") {
    // It's a nested structure, unwrap it
    effectiveWord = word.word;
  }

  // Ensure targetWordString is a string
  const targetWordString =
    typeof effectiveWord.word === "string" ? effectiveWord.word : "";

  const targetWord = targetWordString;
  const correctAnswer = targetWord.toLowerCase();

  useEffect(() => {
    // 生成可用字母
    const letters = generateSpellingLetters(targetWord);
    setAvailableLetters(letters);
    setUsedLetters([]);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(null);
  }, [targetWord]);

  const generateSpellingLetters = (word: string): string[] => {
    const letters = word.toLowerCase().split("");
    const baseSet: string[] = [...letters];
    const distractorsPool = "abcdefghijklmnopqrstuvwxyz".split("");
    // 过滤掉目标词已有字母，避免无意义重复
    const filteredPool = distractorsPool.filter((ch) => !letters.includes(ch));
    // 目标总按钮数量（根据参考 UI，约 10-12 个）
    const targetCount = Math.max(10, Math.min(12, letters.length + 8));
    while (baseSet.length < targetCount && filteredPool.length > 0) {
      const idx = Math.floor(Math.random() * filteredPool.length);
      baseSet.push(filteredPool.splice(idx, 1)[0]);
    }
    return baseSet.sort(() => Math.random() - 0.5);
  };

  const handleLetterClick = (letter: string) => {
    if (showResult) return;
    if (userAnswer.length >= correctAnswer.length) return;
    const letterIndex = availableLetters.indexOf(letter);
    if (letterIndex > -1) {
      const nextAvailable = availableLetters.filter(
        (_, index) => index !== letterIndex
      );
      const nextUsed = [...usedLetters, letter];
      const nextAnswer = userAnswer + letter;
      setAvailableLetters(nextAvailable);
      setUsedLetters(nextUsed);
      setUserAnswer(nextAnswer);
      if (nextAnswer.length === correctAnswer.length) {
        handleSubmit(nextAnswer);
      }
    }
  };

  const handleBackspace = () => {
    if (showResult) return;
    if (usedLetters.length === 0) return;
    const last = usedLetters[usedLetters.length - 1];
    setUsedLetters(usedLetters.slice(0, -1));
    setAvailableLetters([last, ...availableLetters]);
    setUserAnswer(userAnswer.slice(0, -1));
  };

  const handleSubmit = (overrideAnswer?: string) => {
    const answer = (
      overrideAnswer !== undefined ? overrideAnswer : userAnswer
    ).trim();
    if (answer) {
      const correct = answer.toLowerCase() === correctAnswer;
      setIsCorrect(correct);
      setShowResult(true);
      playSound(correct);
      if (!correct) {
        setShowErrorOverlay(true);
      }
      setTimeout(() => {
        onAnswer(correct, answer);
      }, 1000);
    }
  };

  const playSound = (isCorrect: boolean) => {
    // 创建简单的音效
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isCorrect) {
      // 正确答案音效 - 上升音调
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
    } else {
      // 错误答案音效 - 下降音调
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.2);
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playPronunciation = async () => {
    if (!targetWord) return;

    setIsPlaying(true);

    try {
      // 使用Web Speech API
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(targetWord);
        utterance.lang = "en-US";
        utterance.rate = 0.8;
        utterance.pitch = 1;

        utterance.onend = () => {
          setIsPlaying(false);
        };

        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("播放发音失败:", error);
      setIsPlaying(false);
    }
  };

  const nextWord = () => {
    setAvailableLetters(generateSpellingLetters(targetWord));
    setUsedLetters([]);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* 1. Image Area */}
        <div className="relative group animate-fade-in-up">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl p-6 shadow-xl flex items-center justify-center w-64 h-64 border-4 border-white/50 backdrop-blur-sm">
            {/* Fix: Use word.imageValue and lowercase letters */}
            {effectiveWord.hasImage && effectiveWord.imageValue ? (
              effectiveWord.imageType === "emoji" ? (
                <span className="text-8xl animate-bounce-slow">
                  {effectiveWord.imageValue}
                </span>
              ) : effectiveWord.imageType === "url" ? (
                <img
                  src={effectiveWord.imageValue}
                  alt={effectiveWord.word}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <span className="text-8xl">📚</span>
              )
            ) : (
              <span className="text-8xl">🎨</span>
            )}
          </div>
        </div>

        {/* 2. Word Info & Sound */}
        <div className="flex flex-col items-center gap-2 text-white animate-fade-in-up delay-100">
          {/* Meaning commented out as per user request */}
          {/* {!showResult && (
                 <>
                    <div className="text-2xl font-bold bg-white/20 px-6 py-2 rounded-full backdrop-blur-md border border-white/30 shadow-lg">
                        {effectiveWord.meaning}
                    </div>
                 </>
             )} */}

          {/* Pronunciation */}
          <button
            onClick={playPronunciation}
            disabled={isPlaying}
            className="mt-4 w-16 h-16 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-full flex items-center justify-center shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-yellow-200"
          >
            {isPlaying ? (
              <span className="text-3xl animate-pulse">🔊</span>
            ) : (
              <span className="text-3xl">🔈</span>
            )}
          </button>
        </div>

        {/* 3. Spelling Input Slots */}
        <div className="flex flex-col items-center gap-6 w-full animate-fade-in-up delay-200">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {targetWord.split("").map((_: string, index: number) => (
              <div
                key={index}
                className={`
                            w-12 h-14 md:w-14 md:h-16 
                            rounded-xl border-b-4 
                            flex items-center justify-center 
                            text-3xl font-bold 
                            transition-all duration-300
                            ${userAnswer[index]
                    ? "bg-white text-indigo-600 border-indigo-200 transform -translate-y-1 shadow-md"
                    : "bg-white/30 text-white/50 border-white/20"
                  }
                        `}
              >
                {/* Ensure input slot shows lowercase too if desired, usually input matches keyboard */}
                {userAnswer[index] ? userAnswer[index].toLowerCase() : ""}
              </div>
            ))}
          </div>

          {/* Delete Button - Independent Row */}
          <button
            onClick={handleBackspace}
            disabled={showResult || userAnswer.length === 0}
            className="
                    flex items-center gap-2 px-6 py-2 
                    bg-rose-400 hover:bg-rose-500 
                    text-white font-bold rounded-full 
                    shadow-lg border-b-4 border-rose-600 active:border-b-0 active:translate-y-1
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-0
                    transition-all
                "
          >
            <span>⌫</span>
            <span>回退</span>
          </button>
        </div>

        {/* 4. Letter Keyboard */}
        <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl animate-fade-in-up delay-300">
          <div className="text-white/80 font-medium mb-4 text-center">
            选择字母拼写单词
          </div>
          {!showResult ? (
            <>
              <div className="grid grid-cols-5 gap-3 md:gap-4 justify-items-center">
                {availableLetters.map((letter, index) => (
                  <button
                    key={`${letter}-${index}`}
                    onClick={() => handleLetterClick(letter)}
                    disabled={showResult}
                    className="
                                w-12 h-12 md:w-14 md:h-14
                                bg-gradient-to-b from-white to-blue-50
                                hover:from-blue-100 hover:to-blue-200
                                text-indigo-600 text-xl font-bold
                                rounded-xl shadow-md border-b-4 border-blue-200
                                active:border-b-0 active:translate-y-1 active:shadow-none
                                transition-all
                            "
                  >
                    {letter.toLowerCase()}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-4">
              {isCorrect ? (
                <div className="text-4xl font-bold text-green-400 animate-bounce">
                  🎉 太棒了！
                </div>
              ) : (
                <div className="text-4xl font-bold text-rose-400">
                  💪 再接再厉
                </div>
              )}

              <button
                onClick={nextWord}
                className="
                           px-8 py-4 bg-green-500 hover:bg-green-400 
                           text-white text-xl font-bold rounded-2xl
                           shadow-xl border-b-4 border-green-700
                           active:border-b-0 active:translate-y-1
                           transition-all
                        "
              >
                挑战下一个 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Overlay */}
      {showErrorOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="w-[90vw] max-w-lg bg-white rounded-3xl shadow-2xl p-8 transform animate-scale-up">
            <div className="flex flex-col items-center gap-6">
              <div className="text-6xl animate-shake">😢</div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  拼写错误
                </h3>
                <p className="text-slate-500">
                  别灰心，不仅仅是记住字母，更要记住发音哦！
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">正确拼写</span>
                  <button
                    onClick={playPronunciation}
                    className="text-indigo-500 hover:text-indigo-600"
                  >
                    🔊 播放
                  </button>
                </div>
                <div className="text-3xl font-bold text-indigo-600 text-center tracking-wider">
                  {targetWord}
                </div>
                <div className="text-center text-slate-400 mt-1">
                  {(effectiveWord as any).phonetic}
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    setShowErrorOverlay(false);
                    setShowResult(false);
                    setIsCorrect(null);
                    setAvailableLetters(generateSpellingLetters(targetWord));
                    setUsedLetters([]);
                    setUserAnswer("");
                  }}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all"
                >
                  再试一次
                </button>
                <button
                  onClick={() => {
                    setShowErrorOverlay(false);
                    setShowResult(true); // Show result to allow "Next Word"
                    setIsCorrect(false); // Mark as wrong but allow proceed
                  }}
                  className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  跳过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellingMode;
