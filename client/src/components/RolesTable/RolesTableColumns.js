import { Typography, Popconfirm, Row, Col } from 'antd';
import { ROLE_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы ролей
const rolesTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditRole,
    handleCancelMod,
    handleStartEditRole,
    handleDelRole,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура',
      dataIndex: ROLE_FIELDS.ENGL_ABBREVIATION,
      key: ROLE_FIELDS.ENGL_ABBREVIATION,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase(), b[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Описание',
      dataIndex: ROLE_FIELDS.DESCRIPTION,
      key: ROLE_FIELDS.DESCRIPTION,
      width: '30%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings((a[ROLE_FIELDS.DESCRIPTION] || '').toLowerCase(), (b[ROLE_FIELDS.DESCRIPTION] || '').toLowerCase()),
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
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Row>
            <Col>
              <a
                href="#!"
                onClick={() => handleEditRole(record[ROLE_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY])}
              >
                Сохранить
              </a>
            </Col>
            <Col>
              <Popconfirm
                title="Отменить редактирование?"
                onConfirm={handleCancelMod}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  style={{
                    marginRight: 10,
                  }}
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY]))}
                onClick={() => handleStartEditRole(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => handleDelRole(record[ROLE_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ROLE_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        );
      },
    },
  ];
};

export default rolesTableColumns;
