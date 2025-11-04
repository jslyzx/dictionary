import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PronunciationRuleFormModal from '../components/PronunciationRuleFormModal'
import type { PronunciationRule } from '../services/pronunciationRules'

const PronunciationRuleEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setIsModalOpen(false)
    navigate('/pronunciation-rules')
  }

  const handleSubmit = (rule: PronunciationRule) => {
    setIsModalOpen(false)
    navigate(`/pronunciation-rules/${rule.id}`)
  }

  useEffect(() => {
    setIsModalOpen(true)
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <PronunciationRuleFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        ruleId={id ? Number(id) : null}
      />
    </div>
  )
}

export default PronunciationRuleEditPage