import React, { useContext, useEffect } from 'react';
import ServerLogsTable from '../components/ServerLogsTable';
import { LOGS_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с логами действий сервера.
 */
export const ServerLogsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(LOGS_IDS.SERVER_ACTIONS);
  }, [currPage]);

  return (
    <ServerLogsTable />
  );
};
