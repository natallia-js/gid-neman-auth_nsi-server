import { Typography, Popconfirm, Row, Col } from 'antd';
import { APP_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы приложений
const appsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditApp,
    handleCancelMod,
    handleStartEditApp,
    handleDelApp,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура приложения',
      dataIndex: APP_FIELDS.SHORT_TITLE,
      key: APP_FIELDS.SHORT_TITLE,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[APP_FIELDS.SHORT_TITLE].toLowerCase(), b[APP_FIELDS.SHORT_TITLE].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Полное наименование приложения',
      dataIndex: APP_FIELDS.TITLE,
      key: APP_FIELDS.TITLE,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[APP_FIELDS.TITLE].toLowerCase(), b[APP_FIELDS.TITLE].toLowerCase()),
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
                onClick={() => handleEditApp(record[APP_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY]))}
                onClick={() => handleStartEditApp(record)}
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
                onConfirm={() => handleDelApp(record[APP_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[APP_FIELDS.KEY]) &&
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

export default appsTableColumns;
