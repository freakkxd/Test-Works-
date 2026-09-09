interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Не удалось загрузить данные', onRetry }: Props) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-red-600 mb-2">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
          Повторить
        </button>
      )}
    </div>
  );
}
