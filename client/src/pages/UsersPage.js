import React, { useContext, useEffect } from 'react';
import UsersTable from '../components/UsersTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с информацией о пользователях.
 */
export const UsersPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.USERS);
  }, [currPage]);

  return (
    <UsersTable />
  );
};
