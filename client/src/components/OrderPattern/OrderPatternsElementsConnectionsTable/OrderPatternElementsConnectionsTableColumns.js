import { Popconfirm, Row, Col } from 'antd';


// Описание столбцов таблицы связей элементов шаблонов распоряжений
const orderPatternElementsConnectionsTableColumns = (props) => {
  const {
    handleDelConnection,
  } = props;

  return [
    {
      title: '№ п/п',
      dataIndex: 'key',
      key: 'key',
      width: '10%',
      editable: false,
    },
    {
      title: 'Элемент базового шаблона',
      dataIndex: 'baseElementNotation',
      key: 'baseElementNotation',
      width: '30%',
      editable: false,
    },
    {
      title: 'Элемент дочернего шаблона',
      dataIndex: 'childElementNotation',
      key: 'childElementNotation',
      width: '30%',
      editable: false,
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      render: (_, record) => {
        return (
          <Row>
            <Col>
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => handleDelConnection(record.key)}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
          </Row>
        )
      },
    },
  ];
};

export default orderPatternElementsConnectionsTableColumns;
