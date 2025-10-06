'use client'

export default function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-border-light">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}