import React, { useContext, useEffect } from 'react';
import AdminsLogsTable from '../components/AdminsLogsTable';
import { LOGS_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с логами действий администраторов.
 */
export const AdminsLogsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(LOGS_IDS.ADMINS_ACTIONS);
  }, [currPage]);

  return (
    <AdminsLogsTable />
  );
};
