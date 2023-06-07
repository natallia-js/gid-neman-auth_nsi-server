import { Typography, Popconfirm, Row, Col } from 'antd';
import { ECD_STRUCTURAL_DIVISION_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';


// Описание столбцов таблицы структурных подразделений ЭЦД
const ecdStructuralDivisionsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditECDStructuralDivision,
    handleCancelMod,
    handleStartEditECDStructuralDivision,
    handleDelECDStructuralDivision,
    recsBeingProcessed,
    getColumnSearchProps,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: ECD_STRUCTURAL_DIVISION_FIELDS.NAME,
      key: ECD_STRUCTURAL_DIVISION_FIELDS.NAME,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        (a[ECD_STRUCTURAL_DIVISION_FIELDS.NAME] || '').toLowerCase(), (b[ECD_STRUCTURAL_DIVISION_FIELDS.NAME] || '').toLowerCase()),
      ...getColumnSearchProps(ECD_STRUCTURAL_DIVISION_FIELDS.NAME),
    },
    {
      title: 'Должность',
      dataIndex: ECD_STRUCTURAL_DIVISION_FIELDS.POST,
      key: ECD_STRUCTURAL_DIVISION_FIELDS.POST,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        (a[ECD_STRUCTURAL_DIVISION_FIELDS.POST] || '').toLowerCase(), (b[ECD_STRUCTURAL_DIVISION_FIELDS.POST] || '').toLowerCase()),
      ...getColumnSearchProps(ECD_STRUCTURAL_DIVISION_FIELDS.POST),
    },
    {
      title: 'ФИО',
      dataIndex: ECD_STRUCTURAL_DIVISION_FIELDS.FIO,
      key: ECD_STRUCTURAL_DIVISION_FIELDS.FIO,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        (a[ECD_STRUCTURAL_DIVISION_FIELDS.FIO] || '').toLowerCase(), (b[ECD_STRUCTURAL_DIVISION_FIELDS.FIO] || '').toLowerCase()),
      ...getColumnSearchProps(ECD_STRUCTURAL_DIVISION_FIELDS.FIO),
    },
    {
      title: 'Позиция',
      dataIndex: ECD_STRUCTURAL_DIVISION_FIELDS.POSITION,
      key: ECD_STRUCTURAL_DIVISION_FIELDS.POSITION,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        if (!a[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION] && b[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION])
          return 1;
        if (a[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION] && !b[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION])
          return -1;
        return a[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION] - b[ECD_STRUCTURAL_DIVISION_FIELDS.POSITION]
      },
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
                onClick={() => handleEditECDStructuralDivision(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]))}
                onClick={() => handleStartEditECDStructuralDivision(record)}
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
                onConfirm={() => handleDelECDStructuralDivision(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]) &&
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

export default ecdStructuralDivisionsTableColumns;
