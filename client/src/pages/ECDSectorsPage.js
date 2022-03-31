import React, { useContext, useEffect } from 'react';
import ECDSectorsTable from '../components/ECDSectorsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с участками ЭЦД.
 */
export const ECDSectorsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.ECD_SECTORS);
  }, [currPage]);

  return (
    <ECDSectorsTable />
  );
};
