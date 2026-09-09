interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title = 'Ничего не найдено', description, actionLabel, onAction }: Props) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
