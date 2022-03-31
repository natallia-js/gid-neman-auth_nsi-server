import React, { useContext, useEffect } from 'react';
import AppsTable from '../components/AppsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с приложениями.
 */
export const AppsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.APPLICATIONS);
  }, [currPage]);

  return (
    <AppsTable />
  );
};
