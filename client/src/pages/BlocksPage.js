import React, { useContext, useEffect } from 'react';
import BlocksTable from '../components/BlocksTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с перегонами.
 */
export const BlocksPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.BLOCKS);
  }, [currPage]);

  return (
    <BlocksTable />
  );
};
