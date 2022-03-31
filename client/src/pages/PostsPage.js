import React, { useContext, useEffect } from 'react';
import PostsTable from '../components/PostsTable';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';

/**
 * Возвращает компонент, представляющий собой страницу работы с должностями.
 */
export const PostsPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.POSTS);
  }, [currPage]);

  return (
    <PostsTable />
  );
};
