import { Typography, Popconfirm } from 'antd';
import { APP_FIELDS } from '../../constants';

// Описание столбцов таблицы приложений
const appsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditApp,
    handleCancelMod,
    handleStartEditApp,
    handleDelApp
  } = props;

  return [
    {
      title: 'Аббревиатура приложения',
      dataIndex: APP_FIELDS.SHORT_TITLE,
      key: APP_FIELDS.SHORT_TITLE,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[APP_FIELDS.SHORT_TITLE].toLowerCase();
        const sortB = b[APP_FIELDS.SHORT_TITLE].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
      className: 'main-col',
    },
    {
      title: 'Полное наименование приложения',
      dataIndex: APP_FIELDS.TITLE,
      key: APP_FIELDS.TITLE,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[APP_FIELDS.TITLE].toLowerCase();
        const sortB = b[APP_FIELDS.TITLE].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a
              href="#!"
              onClick={() => handleEditApp(record[APP_FIELDS.KEY])}
              style={{
                marginRight: 10,
              }}
            >
              Сохранить
            </a>
            <Popconfirm title="Отменить редактирование?" onConfirm={handleCancelMod}>
              <a href="#!">Отменить</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditApp(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelApp(record[APP_FIELDS.KEY])}>
              <a
                href="#!"
                disabled={editingKey !== ''}
                style={{
                  marginLeft: 10,
                }}
              >
                Удалить
              </a>
            </Popconfirm>
          </span>
        );
      },
    },
  ];
};

export default appsTableColumns;
