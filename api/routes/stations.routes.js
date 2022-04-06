const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  getDefiniteStationValidationRules,
  getDefiniteStationsValidationRules,
  addStationValidationRules,
  delStationValidationRules,
  modStationValidationRules,
} = require('../validators/stations.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TStationTrack } = require('../models/TStationTrack');
const { TStationWorkPlace } = require('../models/TStationWorkPlace');
const deleteStation = require('../routes/deleteComplexDependencies/deleteStation');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  DATA_TO_DEL_NOT_FOUND,

  GET_ALL_STATIONS_ACTION,
  MOD_STATION_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех станций со вложенными списками путей
 * и рабочих мест.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.get(
  '/fullData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (_req, res) => {
    try {
      const data = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_Title', 'St_PENSI_ID', 'St_PENSI_UNMC'],
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        },
        {
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name'],
        }],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение полного списка всех станций (+ пути и рабочие места)',
        error,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех станций со вложенными списками путей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (_req, res) => {
    try {
      const data = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        }],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение полного списка всех станций (+ пути)',
        error,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение объекта конкретной станции со вложенным списком путей.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции (обязателен)
 */
 router.post(
  '/definitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  getDefiniteStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId } = req.body;

    try {
      const data = await TStation.findOne({
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        where: { St_ID: stationId },
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        },
        {
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name'],
        }],
      });

      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации о станции (+ пути)',
        error,
        actionParams: { stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка станций по заданным id этих станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - массив id станций (обязателен)
 */
router.post(
  '/shortDefinitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_STATIONS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  getDefiniteStationsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationIds } = req.body;

    try {
      const data = await TStation.findAll({
        raw: true,
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        where: { St_ID: stationIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка станций по заданным id этих станций',
        error,
        actionParams: { stationIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка станций и их рабочих мест по заданным id станций.
 * Если id станций не указаны, то возвращает список всех станций.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationIds - массив id станций (не обязателен)
 */
 router.post(
  '/workPlacesData',
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationIds } = req.body;

    try {
      const filter = {
        attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        include: [{
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name'],
        }],
      };
      if (stationIds) {
        filter.where = { St_ID: stationIds };
      }
      const data = await TStation.findAll(filter);
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка станций и их рабочих мест (по заданным id станций)',
        error,
        actionParams: { stationIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление новой станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * ESRCode - ЕСР-код станции (обязателен),
 * name - наименование станции (обязательно)
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  addStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { ESRCode, name } = req.body;

    try {
      // Ищем в БД станцию, ESRCode которой совпадает с переданным пользователем
      const candidate = await TStation.findOne({ where: { St_UNMC: ESRCode } });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Станция с таким ЕСР-кодом уже существует' });
      }

      // Создаем в БД запись с данными о новой станции
      const station = await TStation.create({ St_UNMC: ESRCode, St_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', station });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление новой станции',
        error,
        actionParams: { ESRCode, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id станции (обязателен),
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delStationValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции удаления не определен объект транзакции' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    const t = await sequelize.transaction();

    try {
      const deletedCount = await deleteStation(id, t);

      if (!deletedCount) {
        await t.rollback();
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Удаление станции',
        error,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор станции (обязателен),
 * ESRCode - ЕСР-код станции (не обязателен),
 * name - наименование станции (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, ESRCode, name } = req.body;

    try {
      // Ищем в БД станцию, id которой совпадает с переданным пользователем
      const candidate = await TStation.findOne({ where: { St_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная станция не существует в базе данных' });
      }

      // Если необходимо отредактировать ЕСР-код, то ищем в БД станцию, ESRCode которой совпадает с переданным пользователем
      if (ESRCode || (ESRCode === '')) {
        const antiCandidate = await TStation.findOne({ where: { St_UNMC: ESRCode } });

        // Если находим, то смотрим, та ли это самая станция. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.St_ID !== candidate.St_ID)) {
          return res.status(ERR).json({ message: 'Станция с таким ЕСР-кодом уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('ESRCode')) {
        updateFields.St_UNMC = ESRCode;
      }
      if (req.body.hasOwnProperty('name')) {
        updateFields.St_Title = name;
      }

      await TStation.update(updateFields, {
        where: {
          St_ID: id,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о станции',
        error,
        actionParams: { id, ESRCode, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на синхронизацию списка всех станций со списком станций ПЭНСИ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.get(
  '/syncWithPENSI',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_STATION_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции синхронизации не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    let stationsDataHTTPRequest = '';

    try {
      const fetch = require('node-fetch');
      const config = require('config');

      const checkStatus = require('../http/checkStatus');
      const PENSIServerAddress = config.get('PENSI.serverAddress');
      const responseEncoding = config.get('PENSI.responseEncoding'); // кодировка, в которой ПЭНСИ передает данные

      // Из ПЭНСИ получаем для Бел.ж.д. (код дороги = 13) следующую информацию по станциям: id (будет передан
      // вне зависимости от его присутствия в запросе), ЕСР-код станции, наименование станции.
      // Данные запрашиваем без учета истории их изменения. Т.е. придут только актуальные данные (history=0).
      stationsDataHTTPRequest =
        `http://${PENSIServerAddress}/WEBNSI/download.jsp?tab=NSIVIEW.STA&cols=STA_NO,STA_NAME&history=0&filter=ROAD_NO=13`;

      // Вначале пытаюсь получить данные от ПЭНСИ
      let response = await fetch(stationsDataHTTPRequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);

      // Затем декодирую полученные данные
      let buffer = await response.arrayBuffer();
      const decoder = new TextDecoder(responseEncoding);
      const stationsPENSIString = decoder.decode(buffer); // строка со всеми данными по станциям от ПЭНСИ

      // После этого извлекаю данные по станциям из своей БД
      const localStationsData = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_Title', 'St_PENSI_ID', 'St_PENSI_UNMC'],
      });

      // Имея все данные, сравниваю их и вношу необходимые изменения в свою БД

      // Формирую массив подстрок исходной строки данных от ПЭНСИ
      const allRows = stationsPENSIString.split(/\r?\n|\r/);
      // Теперь данные от ПЭНСИ положу в массив для удобства работы с ними
      const pensiStationsArray = [];
      for (let singleRow = 1; singleRow < allRows.length; singleRow += 1) {
        const rowCells = allRows[singleRow].split(';');
        if (rowCells.length < 3) {
          continue;
        }
        pensiStationsArray.push({
          stationId: +rowCells[0], // строку с id станции - в числовое значение
          stationCode: rowCells[1].replace(/"/g,''), // из строки '"ЕСР код"' делаем 'ЕСР код'
          stationName: rowCells[2].replace(/"/g,''), // из строки '"Наименование"' делаем 'Наименование'
        });
      }

      // Для каждой своей записи нахожу соответствующую из ПЭНСИ и сравниваю значения их полей.
      // Если не совпадают - меняю.
      let correspLocalRecord;
      for (let pensiRecord of pensiStationsArray) {
        correspLocalRecord = localStationsData.find((el) => el.St_Title === pensiRecord.stationName);
        if (correspLocalRecord) {
          correspLocalRecord.St_PENSI_ID = pensiRecord.stationId;
          correspLocalRecord.St_PENSI_UNMC = pensiRecord.stationCode;
          correspLocalRecord.save();
        }
      }

      await t.commit();

      // Добавить данные в логи

      res.status(OK).json({ message: 'Информация успешно синхронизирована', syncResults: [] });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Синхронизация таблицы станций с ПЭНСИ',
        error,
        actionParams: { stationsDataHTTPRequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
