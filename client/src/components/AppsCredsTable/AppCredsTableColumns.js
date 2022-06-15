import { Typography, Popconfirm, Row, Col } from 'antd';
import { APP_CREDS_GROUP_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы приложений
const appCredsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditAppCredsGroup,
    handleCancelMod,
    handleStartEditAppCredsGroup,
    handleDelAppCredsGroup,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура группы',
      dataIndex: APP_CREDS_GROUP_FIELDS.SHORT_TITLE,
      key: APP_CREDS_GROUP_FIELDS.SHORT_TITLE,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[APP_CREDS_GROUP_FIELDS.SHORT_TITLE].toLowerCase(), b[APP_CREDS_GROUP_FIELDS.SHORT_TITLE].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Полное наименование группы',
      dataIndex: APP_CREDS_GROUP_FIELDS.TITLE,
      key: APP_CREDS_GROUP_FIELDS.TITLE,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[APP_CREDS_GROUP_FIELDS.TITLE].toLowerCase(), b[APP_CREDS_GROUP_FIELDS.TITLE].toLowerCase()),
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
                onClick={() => handleEditAppCredsGroup(record[APP_CREDS_GROUP_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY]))}
                onClick={() => handleStartEditAppCredsGroup(record)}
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
                onConfirm={() => handleDelAppCredsGroup(record[APP_CREDS_GROUP_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_CREDS_GROUP_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        )
      },
    },
  ];
};

export default appCredsTableColumns;
