import React, { useContext, useEffect } from 'react';
import RolesTable from '../components/RolesTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с ролями.
 */
export const RolesPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.ROLES);
  }, [currPage]);

  return (
    <RolesTable />
  );
};
