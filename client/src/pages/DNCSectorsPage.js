import React, { useContext, useEffect } from 'react';
import DNCSectorsTable from '../components/DNCSectorsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с участками ДНЦ.
 */
export const DNCSectorsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.DNC_SECTORS);
  }, [currPage]);

  return (
    <DNCSectorsTable />
  );
};
