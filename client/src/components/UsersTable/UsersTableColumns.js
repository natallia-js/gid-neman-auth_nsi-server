import { Typography, Popconfirm, Row, Col } from 'antd';
import { USER_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы пользователей
const usersTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditUser,
    handleCancelMod,
    handleStartEditUser,
    handleDelUser,
    handleConfirmUser,
    recsBeingProcessed,
    getColumnSearchProps,
  } = props;

  return [
    {
      title: 'Логин',
      dataIndex: USER_FIELDS.LOGIN,
      key: USER_FIELDS.LOGIN,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[USER_FIELDS.LOGIN].toLowerCase(), b[USER_FIELDS.LOGIN].toLowerCase()),
      className: 'main-col',
      ...getColumnSearchProps(USER_FIELDS.LOGIN),
    },
    {
      title: 'Имя',
      dataIndex: USER_FIELDS.NAME,
      key: USER_FIELDS.NAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[USER_FIELDS.NAME].toLowerCase(), b[USER_FIELDS.NAME].toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.NAME),
    },
    {
      title: 'Отчество',
      dataIndex: USER_FIELDS.FATHERNAME,
      key: USER_FIELDS.FATHERNAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings((a[USER_FIELDS.FATHERNAME] || '').toLowerCase(), (b[USER_FIELDS.FATHERNAME] || '').toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.FATHERNAME),
    },
    {
      title: 'Фамилия',
      dataIndex: USER_FIELDS.SURNAME,
      key: USER_FIELDS.SURNAME,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[USER_FIELDS.SURNAME].toLowerCase(), b[USER_FIELDS.SURNAME].toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.SURNAME),
    },
    {
      title: 'Служба',
      dataIndex: USER_FIELDS.USER_SERVICE,
      key: USER_FIELDS.USER_SERVICE,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings((a[USER_FIELDS.USER_SERVICE] || '').toLowerCase(), (b[USER_FIELDS.USER_SERVICE] || '').toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.USER_SERVICE),
    },
    {
      title: 'Служба шаблонов документов',
      dataIndex: USER_FIELDS.SERVICE,
      key: USER_FIELDS.SERVICE,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings((a[USER_FIELDS.SERVICE] || '').toLowerCase(), (b[USER_FIELDS.SERVICE] || '').toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.SERVICE),
    },
    {
      title: 'Должность',
      dataIndex: USER_FIELDS.POST,
      key: USER_FIELDS.POST,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[USER_FIELDS.POST].toLowerCase(), b[USER_FIELDS.POST].toLowerCase()),
      ...getColumnSearchProps(USER_FIELDS.POST),
    },
    {
      title: 'Контактная информация',
      dataIndex: USER_FIELDS.CONTACT_DATA,
      key: USER_FIELDS.CONTACT_DATA,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps(USER_FIELDS.CONTACT_DATA),
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
                onClick={() => handleEditUser(record[USER_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY]))}
                onClick={() => handleStartEditUser(record)}
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
                onConfirm={() => handleDelUser(record[USER_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {!record[USER_FIELDS.CONFIRMED] &&
            <Col>
              <Popconfirm
                title="Подтвердить запись?"
                onConfirm={() => handleConfirmUser(record[USER_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Подтвердить
                </a>
              </Popconfirm>
            </Col>}
            {recsBeingProcessed && recsBeingProcessed.includes(record[USER_FIELDS.KEY]) &&
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

export default usersTableColumns;
