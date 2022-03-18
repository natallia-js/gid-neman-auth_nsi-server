import { Typography, Popconfirm, Row, Col } from 'antd';
import {
  /*DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
  ROLE_FIELDS,
  STATION_FIELDS,
  STATION_WORK_PLACE_FIELDS,*/
  USER_FIELDS,
} from '../../constants';
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
    /*roleAbbrs,
    stations,
    dncSectorsData,
    ecdSectorsData,*/
  } = props;
/*
  const getRoleAbbr = (roleId) => {
    if (!roleAbbrs) {
      return '';
    }
    const role = roleAbbrs.find((r) => r[ROLE_FIELDS.KEY] === roleId);
    if (!role) {
      return '';
    }
    return role[ROLE_FIELDS.ENGL_ABBREVIATION];
  };

  const getStationWorkPlaceName = (stationId, workPlaceId) => {
    if (!stations) {
      return '';
    }
    const station = stations.find((s) => s[STATION_FIELDS.KEY] === stationId);
    if (!station || !station[STATION_FIELDS.WORK_PLACES]) {
      return '';
    }
    if (!workPlaceId) {
      return station[STATION_FIELDS.NAME_AND_CODE];
    }
    const workPlace = station[STATION_FIELDS.WORK_PLACES].find((wp) => wp[STATION_WORK_PLACE_FIELDS.KEY] === workPlaceId);
    if (!workPlace) {
      return '';
    }
    return `${station[STATION_FIELDS.NAME_AND_CODE]} ${workPlace[STATION_WORK_PLACE_FIELDS.NAME]}`;
  };

  const getDNCSectorName = (sectorId) => {
    if (!dncSectorsData) {
      return '';
    }
    const dncSector = dncSectorsData.find((s) => s[DNCSECTOR_FIELDS.KEY] === sectorId);
    if (!dncSector) {
      return '';
    }
    return dncSector[DNCSECTOR_FIELDS.NAME];
  };

  const getECDSectorName = (sectorId) => {
    if (!ecdSectorsData) {
      return '';
    }
    const ecdSector = ecdSectorsData.find((s) => s[ECDSECTOR_FIELDS.KEY] === sectorId);
    if (!ecdSector) {
      return '';
    }
    return ecdSector[ECDSECTOR_FIELDS.NAME];
  };
*/
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
    /*
    {
      title: 'Роли',
      dataIndex: USER_FIELDS.ROLES,
      key: USER_FIELDS.ROLES,
      width: '10%',
      editable: false,
      render: (_, record) => {
        return !record[USER_FIELDS.ROLES] || !record[USER_FIELDS.ROLES].length ? <></> :
          <>{record[USER_FIELDS.ROLES].map((roleId) => getRoleAbbr(roleId)).join(', ')}</>;
      },
    },
    {
      title: 'Рабочие полигоны',
      dataIndex: [USER_FIELDS.STATION_WORK_POLIGONS, USER_FIELDS.DNC_SECTOR_WORK_POLIGONS, USER_FIELDS.ECD_SECTOR_WORK_POLIGONS],
      key: USER_FIELDS.KEY,
      width: '10%',
      editable: false,
      render: (_, record) => {
        let displayString = '';
        const stationPoligons =
          (!record[USER_FIELDS.STATION_WORK_POLIGONS] || !record[USER_FIELDS.STATION_WORK_POLIGONS].length ? [] :
            record[USER_FIELDS.STATION_WORK_POLIGONS].map((st) => getStationWorkPlaceName(st.id, st.workPlaceId)))
          .filter((st) => st && st.length > 0);
        if (stationPoligons.length) {
          displayString += `Станции: ${stationPoligons.map((st) => st).join(', ')}`;
        }
        const dncSectorPoligons =
          (!record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS] || !record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS].length ? [] :
            record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS].map((id) => getDNCSectorName(id)))
          .filter((sector) => sector && sector.length > 0);
        if (dncSectorPoligons.length) {
          if (displayString.length) {
            displayString += '; ';
          }
          displayString += `Участки ДНЦ: ${dncSectorPoligons.map((poligon) => poligon).join(', ')}`;
        }
        const ecdSectorPoligons =
          (!record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS] || !record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS].length ? [] :
            record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS].map((id) => getECDSectorName(id)))
          .filter((sector) => sector && sector.length > 0);
          if (ecdSectorPoligons.length) {
            if (displayString.length) {
              displayString += '; ';
            }
            displayString += `Участки ЭЦД: ${ecdSectorPoligons.map((poligon) => poligon).join(', ')}`;
          }
        return <>{displayString}</>;
      },
    },*/
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
