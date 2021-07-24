import React, { useState, useEffect } from 'react';
import { Table, } from 'antd';
import orderPatternElementsConnectionsTableColumns from './OrderPatternElementsConnectionsTableColumns';


/**
 * Компонент таблицы с информацией о связанных элементах шаблонов раяпоряжений.
 */
const OrderPatternsElementsConnectionsTable = ({ connectionsArray, onDelConnection }) => {
  const [tableData, setTableData] = useState(null);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    if (!connectionsArray || !connectionsArray.length) {
      setTableData(null);
      return;
    }
    const updatedTableData = [];
    connectionsArray.forEach((connection, index) => {
      updatedTableData.push({
        key: index + 1,
        baseElementNotation: connection.baseParamNotation,
        childElementNotation: connection.childParamNotation,
        baseElementId: connection.baseParamId,
        childElementId: connection.childParamId,
      })
    });
    setTableData(updatedTableData);
  }, [connectionsArray]);


  /**
   * Удаляет запись из таблицы
   */
  const handleDelConnection = async (recordKey) => {
    const recToDel = tableData.find((rec) => rec.key === recordKey);
    if (recToDel) {
      onDelConnection({
        baseParamId: recToDel.baseElementId,
        childParamId: recToDel.childElementId,
      });
    }
  };


  // Описание столбцов таблицы связей элементов шаблонов
  const columns = orderPatternElementsConnectionsTableColumns({
    handleDelConnection,
  });


  return (
    <Table
      bordered
      dataSource={tableData}
      columns={columns}
      sticky={true}
    />
  );
};


export default OrderPatternsElementsConnectionsTable;
