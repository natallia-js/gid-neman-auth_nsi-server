import { Typography, Popconfirm } from 'antd';
import { APP_CRED_FIELDS } from '../../../constants';

// Описание столбцов таблицы полномочий пользователей в приложении
const appCredsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditAppCred,
    handleCancelMod,
    handleStartEditAppCred,
    handleDelAppCred
  } = props;

  return [
    {
      title: 'Аббревиатура полномочия',
      dataIndex: APP_CRED_FIELDS.ENGL_ABBREVIATION,
      key: APP_CRED_FIELDS.ENGL_ABBREVIATION,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[APP_CRED_FIELDS.ENGL_ABBREVIATION].toLowerCase();
        const sortB = b[APP_CRED_FIELDS.ENGL_ABBREVIATION].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Полное наименование полномочия',
      dataIndex: APP_CRED_FIELDS.DESCRIPTION,
      key: APP_CRED_FIELDS.DESCRIPTION,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = (a[APP_CRED_FIELDS.DESCRIPTION] || '').toLowerCase();
        const sortB = (b[APP_CRED_FIELDS.DESCRIPTION] || '').toLowerCase();
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
              onClick={() => handleEditAppCred(record.key)}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditAppCred(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelAppCred(record.key)}>
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

export default appCredsTableColumns;
