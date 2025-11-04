export interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isProcessing?: boolean
}

declare const ConfirmDialog: React.FC<ConfirmDialogProps>
export default ConfirmDialog