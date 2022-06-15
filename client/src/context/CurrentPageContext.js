import { createContext } from 'react';

export const PAGES_IDS = {
  USER_INFO: '0',
  APP_CREDS_GROUPS: '1',
  ROLES: '2',
  SERVICES: '3',
  POSTS: '4',
  USERS: '5',
  STATIONS: '6',
  BLOCKS: '7',
  DNC_SECTORS: '8',
  ECD_SECTORS: '9',
  ORDER_PATTERNS: '10',
  LOGS: '11',
  HELP: '12',
  EXIT: '13',
};

export const LOGS_IDS = {
  SERVER_ERRORS: `${PAGES_IDS.LOGS}_1`,
  ADMINS_ACTIONS: `${PAGES_IDS.LOGS}_2`,
  USERS_ACTIONS: `${PAGES_IDS.LOGS}_3`,
  SERVER_ACTIONS: `${PAGES_IDS.LOGS}_4`,
};

/**
 * Объект контекста текущей страницы
 */
export const CurrentPageContext = createContext({
  pageId: null,
  changePageId: () => {},
});
