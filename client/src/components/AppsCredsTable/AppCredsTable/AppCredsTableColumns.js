import { Typography, Popconfirm, Row, Col } from 'antd';
import { APP_CRED_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';


// Описание столбцов таблицы полномочий пользователей в приложении
const appCredsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditAppCred,
    handleCancelMod,
    handleStartEditAppCred,
    handleDelAppCred,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура полномочия',
      dataIndex: APP_CRED_FIELDS.ENGL_ABBREVIATION,
      key: APP_CRED_FIELDS.ENGL_ABBREVIATION,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        a[APP_CRED_FIELDS.ENGL_ABBREVIATION].toLowerCase(), b[APP_CRED_FIELDS.ENGL_ABBREVIATION].toLowerCase()),
    },
    {
      title: 'Описание полномочия',
      dataIndex: APP_CRED_FIELDS.DESCRIPTION,
      key: APP_CRED_FIELDS.DESCRIPTION,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        (a[APP_CRED_FIELDS.DESCRIPTION] || '').toLowerCase(), (b[APP_CRED_FIELDS.DESCRIPTION] || '').toLowerCase()),
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
                onClick={() => handleEditAppCred(record[APP_CRED_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY]))}
                onClick={() => handleStartEditAppCred(record)}
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
                onConfirm={() => handleDelAppCred(record[APP_CRED_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_CRED_FIELDS.KEY]) &&
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

export default appCredsTableColumns;
