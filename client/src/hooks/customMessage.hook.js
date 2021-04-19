import { useCallback } from 'react';
import { message } from 'antd';


export const MESSAGE_TYPES = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
});


/**
 * Хук для вывода всплывающего сообщения.
 */
export const useCustomMessage = () => {
  return useCallback((messType, text) => {
    switch (messType) {
      case MESSAGE_TYPES.SUCCESS:
        message.success(text);
        break;
      case MESSAGE_TYPES.ERROR:
        message.error(text);
        break;
      case MESSAGE_TYPES.WARNING:
        message.warning(text);
        break;
      default:
        message.info(text);
    }
  }, []);
};
