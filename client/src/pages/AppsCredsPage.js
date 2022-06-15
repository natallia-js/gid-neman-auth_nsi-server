import React, { useContext, useEffect } from 'react';
import AppsCredsTable from '../components/AppsCredsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с группами полномочий в приложениях ГИД Неман.
 */
export const AppsCredsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.APP_CREDS_GROUPS);
  }, [currPage]);

  return (
    <AppsCredsTable />
  );
};
