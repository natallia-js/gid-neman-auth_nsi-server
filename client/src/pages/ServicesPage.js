import React, { useContext, useEffect } from 'react';
import ServicesTable from '../components/ServicesTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы со службами.
 */
export const ServicesPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.SERVICES);
  }, [currPage]);

  return (
    <ServicesTable />
  );
};
