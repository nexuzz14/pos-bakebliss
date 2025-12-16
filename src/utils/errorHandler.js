export function handleError(error, fallbackMessage, showToast) {
  console.error(error);
  showToast(fallbackMessage, 'error');
}