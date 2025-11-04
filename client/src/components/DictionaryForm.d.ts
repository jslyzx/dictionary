export interface DictionaryFormData {
  name: string
  description: string | null
  isEnabled: boolean
  isMastered: boolean
}

export interface DictionaryFormProps {
  initialData?: {
    id: number
    name: string
    description: string | null
    isEnabled: boolean
    isMastered: boolean
  }
  onSubmit: (formData: DictionaryFormData) => void
  formId: string
  isSubmitting?: boolean
}

declare const DictionaryForm: React.FC<DictionaryFormProps>
export default DictionaryForm