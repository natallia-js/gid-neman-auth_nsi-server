import { useCallback } from 'react';


/**
 * Хук для вывода всплывающего сообщения.
 */
export const useMessage = () => {
  return useCallback((text) => {
    if (window.M && text) {
      // Materialize provides an easy way for you to send unobtrusive alerts to your users through toasts.
      window.M.toast({ html: text });
    }
  }, []);
}
