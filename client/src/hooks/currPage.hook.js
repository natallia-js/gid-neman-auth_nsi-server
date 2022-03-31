import { useState, useCallback } from 'react';


/**
 * Пользовательский хук для работы с настройками текущей страницы пользователя
 */
export const useCurrPage = () => {
  // ID текущей странциы
  const [pageId, setPageId] = useState(-1);

  const changePageId = useCallback((newPageId) => {
    setPageId(newPageId);
  }, []);

  return {
    pageId,
    changePageId,
  };
};
