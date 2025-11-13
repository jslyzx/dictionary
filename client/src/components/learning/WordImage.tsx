// Word type is used in the component props interface

interface WordImageProps {
  word: string
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
  className?: string
}

const WordImage = ({ word, imageType, imageValue, className = '' }: WordImageProps) => {
  if (!imageType || !imageValue) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-sm">{word}</div>
        </div>
      </div>
    )
  }

  const renderImage = () => {
    switch (imageType) {
      case 'url':
        return (
          <img 
            src={imageValue} 
            alt={word}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        )
      case 'iconfont':
        return (
          <div className="text-8xl text-center">
            <i className={`iconfont ${imageValue}`}></i>
          </div>
        )
      case 'emoji':
        return (
          <div className="text-8xl text-center">
            {imageValue}
          </div>
        )
      default:
        return (
          <div className="text-8xl text-center">
            📚
          </div>
        )
    }
  }

  return (
    <div className={`bg-white rounded-lg border-2 border-gray-200 p-4 ${className}`} style={{ minHeight: '200px' }}>
      {renderImage()}
      {/* Fallback for failed image loads */}
      {imageType === 'url' && (
        <div className="hidden text-8xl text-center text-gray-400">
          📚
        </div>
      )}
    </div>
  )
}

export default WordImage
