import { ECDSECTOR_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';


// Описание столбцов таблицы участков ЭЦД
const ecdSectorsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditECDSector,
    handleCancelMod,
    handleStartEditECDSector,
    handleDelECDSector
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: ECDSECTOR_FIELDS.NAME,
      key: ECDSECTOR_FIELDS.NAME,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[ECDSECTOR_FIELDS.NAME].toLowerCase();
        const sortB = b[ECDSECTOR_FIELDS.NAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
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
              onClick={() => handleEditECDSector(record.key)}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditECDSector(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelECDSector(record.key)}>
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

export default ecdSectorsTableColumns;
