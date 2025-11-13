interface LearningProgressProps {
  progress: { current: number; total: number; percentage: number }
}

const LearningProgress = ({ progress }: LearningProgressProps) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            进度：{progress.current} / {progress.total}
          </span>
          <span className="text-sm text-gray-500">
            {progress.percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          >
            {/* Progress indicator */}
            <div className="relative h-full">
              <div className="absolute right-0 top-0 w-4 h-4 bg-yellow-500 rounded-full transform -translate-y-1 -translate-x-1 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LearningProgress
