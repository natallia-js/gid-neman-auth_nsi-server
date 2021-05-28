import { Typography, Popconfirm, Row, Col } from 'antd';
import { POST_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы должностей
const postsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditPost,
    handleCancelMod,
    handleStartEditPost,
    handleDelPost,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура',
      dataIndex: POST_FIELDS.ABBREV,
      key: POST_FIELDS.ABBREV,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[POST_FIELDS.ABBREV].toLowerCase(), b[POST_FIELDS.ABBREV].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Наименование',
      dataIndex: POST_FIELDS.TITLE,
      key: POST_FIELDS.TITLE,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[POST_FIELDS.TITLE].toLowerCase(), b[POST_FIELDS.TITLE].toLowerCase()),
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
                onClick={() => handleEditPost(record[POST_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY]))}
                onClick={() => handleStartEditPost(record)}
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
                onConfirm={() => handleDelPost(record[POST_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[POST_FIELDS.KEY]) &&
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

export default postsTableColumns;
