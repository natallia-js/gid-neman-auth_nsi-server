import { ROLE_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';

import '../../assets/styles/tables.scss';

// Описание столбцов таблицы ролей
const rolesTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditRole,
    handleCancelMod,
    handleStartEditRole,
    handleDelRole
  } = props;

  return [
    {
      title: 'Аббревиатура',
      dataIndex: ROLE_FIELDS.ENGL_ABBREVIATION,
      key: ROLE_FIELDS.ENGL_ABBREVIATION,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase();
        const sortB = b[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase();
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
      title: 'Описание',
      dataIndex: ROLE_FIELDS.DESCRIPTION,
      key: ROLE_FIELDS.DESCRIPTION,
      width: '30%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = (a[ROLE_FIELDS.DESCRIPTION] || '').toLowerCase();
        const sortB = (b[ROLE_FIELDS.DESCRIPTION] || '').toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Доступна администратору нижнего уровня',
      dataIndex: ROLE_FIELDS.SUB_ADMIN_CAN_USE,
      key: ROLE_FIELDS.SUB_ADMIN_CAN_USE,
      width: '20%',
      editable: true,
      render: (_, record) => {
        return <span>{record[ROLE_FIELDS.SUB_ADMIN_CAN_USE] ? 'Да' : 'Нет'}</span>
      }
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
              onClick={() => handleEditRole(record.key)}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditRole(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelRole(record.key)}>
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

export default rolesTableColumns;
