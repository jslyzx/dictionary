import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LearningService } from "../services/learning";
import type { LearningSettings, LearningMode } from "../types/learning";
import type { Word } from "../types/word";
import MultipleChoiceMode from "../components/learning/MultipleChoiceMode";
import SpellingMode from "../components/learning/SpellingModeNew";
import FlashCardMode from "../components/learning/FlashCardMode";
import LearningSettingsModal from "../components/learning/LearningSettingsModal";
import LearningProgress from "../components/learning/LearningProgress";

const VocabularyLearningPage = () => {
  const navigate = useNavigate();
  const [learningService] = useState(() => new LearningService());
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [learningMode, setLearningMode] =
    useState<LearningMode>("multiple-choice");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [settings, setSettings] = useState<LearningSettings>({
    mode: "multiple-choice",
    wordCount: 10,
    difficultyFilter: [],
    masteryStatusFilter: "unmastered",
    includePronunciation: true,
    includeImages: true,
    autoPlayAudio: false,
  });

  useEffect(() => {
    if (sessionStarted) {
      const current = learningService.getSessionManager().getCurrentWord();

      if (current) {
        // Determine if current is a flat Word object or nested (WordPlanWord)
        let wordData: any = current;
        // Check if 'word' property exists and is an object (nested structure check)
        if (current.word && typeof current.word === "object") {
          wordData = current.word;
        }

        setCurrentWord({
          id: String(wordData.id),
          word: wordData.word as string,
          phonetic: wordData.phonetic,
          meaning: wordData.meaning,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pronunciation1: (wordData as any).pronunciation1 ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pronunciation2: (wordData as any).pronunciation2 ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pronunciation3: (wordData as any).pronunciation3 ?? null,
          notes: wordData.notes ?? null,
          createdAt: new Date().toISOString(),
          difficulty: wordData.difficulty as 0 | 1 | 2 | null,
          isMastered: wordData.isMastered,
          pronunciationRules: [],
          hasImage: wordData.hasImage,
          imageType: wordData.imageType,
          imageValue: wordData.imageValue,
          sentence: wordData.sentence ?? null,
        });
      }
    }
  }, [sessionStarted, learningService]);

  const handleStartSession = async (newSettings: LearningSettings) => {
    setIsLoading(true);
    setSettings(newSettings);
    setLearningMode(newSettings.mode);

    try {
      const success = await learningService.startLearningSession(newSettings);

      if (success) {
        setSessionStarted(true);
        setShowSettings(false);

        const current = learningService.getSessionManager().getCurrentWord();
        if (current) {
          let wordData: any = current;
          if (current.word && typeof current.word === "object") {
            wordData = current.word;
          }

          setCurrentWord({
            id: String(wordData.id),
            word: wordData.word as string,
            phonetic: wordData.phonetic,
            meaning: wordData.meaning,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation1: (wordData as any).pronunciation1 ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation2: (wordData as any).pronunciation2 ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation3: (wordData as any).pronunciation3 ?? null,
            notes: wordData.notes ?? null,
            createdAt: new Date().toISOString(),
            difficulty: wordData.difficulty as 0 | 1 | 2 | null,
            isMastered: wordData.isMastered,
            pronunciationRules: [],
            hasImage: wordData.hasImage,
            imageType: wordData.imageType,
            imageValue: wordData.imageValue,
            sentence: wordData.sentence ?? null,
          });
        }
      } else {
        setFeedback({ type: "error", message: "当前设置下没有可学习的单词" });
      }
    } catch (error) {
      setFeedback({ type: "error", message: "启动学习会话失败" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    try {
      const result = await learningService.submitAnswer(answer);

      if (result.isCorrect) {
        setFeedback({ type: "success", message: "答对了！" });
      } else {
        const currentWord = learningService
          .getSessionManager()
          .getCurrentWord();

        // Handle potentially missing nested word property for error message
        const displayWord = currentWord?.word;
        // Check if displayWord is object (if nested) or string (if flat)
        const wordText =
          typeof displayWord === "string"
            ? displayWord
            : (displayWord as any)?.word;
        const meaningText = currentWord?.meaning; // meaning is usually at top level in LearningWord

        setFeedback({
          type: "error",
          message: `不正确。正确答案是：${meaningText || wordText}`,
        });
      }

      // Clear feedback after 2 seconds
      setTimeout(() => setFeedback(null), 2000);

      // Move to next word or end session
      if (!result.nextWord) {
        // Session completed
        const stats = learningService.getSessionStats();
        alert(`学习完成！正确率：${stats.accuracy}%`);
        navigate("/words");
      } else {
        if (result.nextWord) {
          let wordData: any = result.nextWord;
          // result.nextWord comes from session manager which returns Word (mapped).
          // But if mapLearningWordToWord uses a flat structure, we are good.
          // Just be safe.
          if (
            result.nextWord.word &&
            typeof result.nextWord.word === "object"
          ) {
            wordData = result.nextWord.word;
          }

          setCurrentWord({
            id: String(wordData.id),
            word: wordData.word as string,
            phonetic: wordData.phonetic,
            meaning: wordData.meaning,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation1: (wordData as any).pronunciation1 ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation2: (wordData as any).pronunciation2 ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pronunciation3: (wordData as any).pronunciation3 ?? null,
            notes: wordData.notes ?? null,
            createdAt: new Date().toISOString(),
            difficulty: wordData.difficulty as 0 | 1 | 2 | null,
            isMastered: wordData.isMastered,
            pronunciationRules: [],
            hasImage: wordData.hasImage,
            imageType: wordData.imageType,
            imageValue: wordData.imageValue,
            sentence: wordData.sentence ?? null,
          });
        }
      }
    } catch (error) {
      setFeedback({ type: "error", message: "提交答案失败" });
    }
  };

  const handleEndSession = () => {
    if (confirm("确定要结束本次学习吗？")) {
      learningService.endSession();
      navigate("/words");
    }
  };

  const progress = learningService.getCurrentProgress();
  const stats = learningService.getSessionStats();

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LearningSettingsModal
          settings={settings}
          onStart={handleStartSession}
          onCancel={() => navigate("/words")}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (!sessionStarted || !currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在准备学习...</p>
        </div>
      </div>
    );
  }

  const renderLearningMode = () => {
    const commonProps = {
      word: currentWord,
      onAnswer: handleAnswerSubmit,
      onSkip: () => handleAnswerSubmit(""),
      onEnd: handleEndSession,
      settings: settings,
      progress: progress,
      stats: stats,
      feedback: feedback,
    };

    switch (learningMode) {
      case "multiple-choice":
        return <MultipleChoiceMode {...commonProps} />;
      case "spelling":
        return (
          <SpellingMode
            word={currentWord}
            onAnswer={(isCorrect, answer) => handleAnswerSubmit(answer)}
            onSkip={() => handleAnswerSubmit("")}
            progress={progress}
          />
        );
      case "flash-card":
        return <FlashCardMode {...commonProps} />;
      default:
        return <MultipleChoiceMode {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEndSession}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← 结束学习
              </button>
              <div className="text-sm text-gray-500">
                模式：
                {(() => {
                  const map: Record<string, string> = {
                    "multiple-choice": "选择题",
                    spelling: "拼写",
                    "flash-card": "闪卡",
                  };
                  return map[learningMode] || learningMode;
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                答对：{stats.correct} | 答错：{stats.incorrect}
              </div>
              <div className="text-sm font-medium text-blue-600">
                正确率：{stats.accuracy}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <LearningProgress progress={progress} />

      {/* Learning Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">{renderLearningMode()}</div>
    </div>
  );
};

export default VocabularyLearningPage;
