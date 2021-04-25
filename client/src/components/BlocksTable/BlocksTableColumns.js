import { BLOCK_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';

// Описание столбцов таблицы перегонов
const blocksTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditBlock,
    handleCancelMod,
    handleStartEditBlock,
    handleDelBlock
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: BLOCK_FIELDS.NAME,
      key: BLOCK_FIELDS.NAME,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[BLOCK_FIELDS.NAME].toLowerCase();
        const sortB = b[BLOCK_FIELDS.NAME].toLowerCase();
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
      title: 'Станция 1',
      dataIndex: BLOCK_FIELDS.STATION1_NAME,
      key: BLOCK_FIELDS.STATION1_NAME,
      width: '20%',
      editable: true,
    },
    {
      title: 'Станция 2',
      dataIndex: BLOCK_FIELDS.STATION2_NAME,
      key: BLOCK_FIELDS.STATION2_NAME,
      width: '20%',
      editable: true,
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
              onClick={() => handleEditBlock(record[BLOCK_FIELDS.KEY])}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditBlock(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelBlock(record[BLOCK_FIELDS.KEY])}>
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

export default blocksTableColumns;
