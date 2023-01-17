import { ADMIN_LOGS_FIELDS } from '../../constants';


// Описание столбцов таблицы логов действий администраторов
const adminsLogsTableColumns = ({ getColumnSearchProps }) => {
  return [
    {
      title: 'Администратор',
      dataIndex: ADMIN_LOGS_FIELDS.USER,
      key: ADMIN_LOGS_FIELDS.USER,
      width: '20%',
      editable: false,
      className: 'main-col',
      ...getColumnSearchProps(ADMIN_LOGS_FIELDS.USER),
    },
    {
      title: 'Время операции',
      dataIndex: ADMIN_LOGS_FIELDS.ACTION_TIME,
      key: ADMIN_LOGS_FIELDS.ACTION_TIME,
      width: '10%',
      editable: false,
    },
    {
      title: 'Действие',
      dataIndex: ADMIN_LOGS_FIELDS.ACTION,
      key: ADMIN_LOGS_FIELDS.ACTION,
      width: '20%',
      editable: false,
      ...getColumnSearchProps(ADMIN_LOGS_FIELDS.ACTION),
    },
    {
      title: 'Параметры действия',
      dataIndex: ADMIN_LOGS_FIELDS.ACTION_PARAMS,
      key: ADMIN_LOGS_FIELDS.ACTION_PARAMS,
      width: '50%',
      editable: false,
    },
  ];
};

export default adminsLogsTableColumns;
