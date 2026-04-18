export default function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-ink-800 border border-ink-600 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-600">
          <h3 className="font-display font-bold text-white text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate2-dim hover:text-white text-2xl leading-none transition-colors"
          >×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-ink-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
