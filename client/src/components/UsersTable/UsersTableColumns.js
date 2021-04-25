import { USER_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';

// Описание столбцов таблицы пользователей
const usersTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditUser,
    handleCancelMod,
    handleStartEditUser,
    handleDelUser,
  } = props;

  return [
    {
      title: 'Логин',
      dataIndex: USER_FIELDS.LOGIN,
      key: USER_FIELDS.LOGIN,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.LOGIN].toLowerCase();
        const sortB = b[USER_FIELDS.LOGIN].toLowerCase();
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
      title: 'Имя',
      dataIndex: USER_FIELDS.NAME,
      key: USER_FIELDS.NAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.NAME].toLowerCase();
        const sortB = b[USER_FIELDS.NAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Отчество',
      dataIndex: USER_FIELDS.FATHERNAME,
      key: USER_FIELDS.FATHERNAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.FATHERNAME].toLowerCase();
        const sortB = b[USER_FIELDS.FATHERNAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Фамилия',
      dataIndex: USER_FIELDS.SURNAME,
      key: USER_FIELDS.SURNAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.SURNAME].toLowerCase();
        const sortB = b[USER_FIELDS.SURNAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Должность',
      dataIndex: USER_FIELDS.POST,
      key: USER_FIELDS.POST,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.POST].toLowerCase();
        const sortB = b[USER_FIELDS.POST].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Служба',
      dataIndex: USER_FIELDS.SERVICE,
      key: USER_FIELDS.SERVICE,
      width: '5%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.SERVICE].toLowerCase();
        const sortB = b[USER_FIELDS.SERVICE].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Участок',
      dataIndex: USER_FIELDS.SECTOR,
      key: USER_FIELDS.SECTOR,
      width: '15%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[USER_FIELDS.SECTOR].toLowerCase();
        const sortB = b[USER_FIELDS.SECTOR].toLowerCase();
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
              onClick={() => handleEditUser(record[USER_FIELDS.KEY])}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditUser(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelUser(record[USER_FIELDS.KEY])}>
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

export default usersTableColumns;
