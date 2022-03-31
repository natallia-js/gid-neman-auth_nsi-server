import React, { useContext, useEffect } from 'react';
import StationsTable from '../components/StationsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы со станциями.
 */
export const StationsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.STATIONS);
  }, [currPage]);

  return (
    <StationsTable />
  );
};
