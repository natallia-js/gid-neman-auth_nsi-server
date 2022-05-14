import { SERVER_LOGS_FIELDS } from '../../constants';


// Описание столбцов таблицы логов серверных действий.
const serverLogsTableColumns = () => {
  return [
    {
      title: 'Время операции',
      dataIndex: SERVER_LOGS_FIELDS.ACTION_TIME,
      key: SERVER_LOGS_FIELDS.ACTION_TIME,
      width: '20%',
      editable: false,
    },
    {
      title: 'Действие',
      dataIndex: SERVER_LOGS_FIELDS.ACTION,
      key: SERVER_LOGS_FIELDS.ACTION,
      width: '20%',
      editable: false,
    },
    {
      title: 'Описание',
      dataIndex: SERVER_LOGS_FIELDS.DESCRIPTION,
      key: SERVER_LOGS_FIELDS.DESCRIPTION,
      width: '60%',
      editable: false,
    },
  ];
};

export default serverLogsTableColumns;
