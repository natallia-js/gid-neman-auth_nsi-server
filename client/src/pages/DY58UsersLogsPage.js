import React, { useContext, useEffect } from 'react';
import DY58UsersLogsTable from '../components/DY58UsersLogsTable';
import { LOGS_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с логами действий пользователей ДУ-58.
 */
export const DY58UsersLogsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(LOGS_IDS.USERS_ACTIONS);
  }, [currPage]);

  return (
    <DY58UsersLogsTable />
  );
};
