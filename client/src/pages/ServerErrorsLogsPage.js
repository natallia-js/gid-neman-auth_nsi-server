import React, { useContext, useEffect } from 'react';
import ServerErrorsLogsTable from '../components/ServerErrorsLogsTable';
import { LOGS_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с логами серверных ошибок.
 */
export const ServerErrorsLogsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(LOGS_IDS.SERVER_ERRORS);
  }, [currPage]);

  return (
    <ServerErrorsLogsTable />
  );
};
