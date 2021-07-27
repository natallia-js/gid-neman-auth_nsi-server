import { useState, useCallback } from 'react';


export const useSearchTree = (initialTree) => {
  const [searchTreeValue, setSearchTreeValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  /**
   *
   */
  const onExpand = useCallback((expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  });


  /**
   *
   */
  const onChangeSearchValue = useCallback((e) => {
    const value = e.target.value.toLowerCase();
    const expandedKeysArray = [];
    if (value !== '') {
      const getExpandedKeys = (tree) => {
        for (let i = 0; i < tree.length; i += 1) {
          const node = tree[i];
          if (node.title.toLowerCase().indexOf(value) > -1) {
            expandedKeysArray.push(node.key);
          }
          if (node.children) {
            getExpandedKeys(node.children);
          }
        }
      };
      getExpandedKeys(initialTree);
    }
    setExpandedKeys(expandedKeysArray);
    setSearchTreeValue(value);
    setAutoExpandParent(true);
  });


  /**
   *
   * @param {*} data
   * @returns
   */
  const loop = useCallback((data) =>
    data.map((item) => {
      const index = item.title.toLowerCase().indexOf(searchTreeValue);
      const beforeStr = item.title.substr(0, index);
      const afterStr = item.title.substr(index + searchTreeValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span className="tree-search-value">
              {item.title.substring(index, index + searchTreeValue.length)}
            </span>
            {afterStr}
          </span>
        ) : (
          <span>{item.title}</span>
        );
      if (item.children) {
        return { ...item, title, children: loop(item.children) };
      }
      return {
        ...item,
        title,
      };
    }));


  return {
    searchTreeValue,
    expandedKeys,
    autoExpandParent,
    onExpand,
    onChangeSearchValue,
    loop,
  };
};
