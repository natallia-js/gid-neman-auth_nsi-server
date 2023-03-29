const { Router } = require('express');
const crypto = require('crypto');
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
const { addAdminActionInfo, addError } = require('../serverSideProcessing/processLogsActions');
const { userPostFIOString } = require('../routes/additional/getUserTransformedData');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  DATA_TO_DEL_NOT_FOUND,
  SUCCESS_MOD_RES,
  SUCCESS_DEL_MESS,
  SUCCESS_ADD_MESS,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех станций со вложенными списками путей
 * и рабочих мест.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/fullData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS_AND_WORK_PLACES; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title', 'St_PENSI_ID', 'St_PENSI_UNMC'],
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        },
        {
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name', 'SWP_Type'],
        }],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение полного списка всех станций (+ пути и рабочие места)',
        error: error.message,
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
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATIONS_WITH_TRACKS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title'],
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
        error: error.message,
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
 * stationId - id станции (обязателен),
 * onlyHash - если true, то ожидается, что запрос вернет только хэш-значение информации о станции,
 *   если false, то запрос возвращает всю запрошенную информацию о станции
 *   (параметр не обязателен; если не указан, то запрос возвращает информацию о запрашиваемом участке)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/definitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DEFINIT_STATION_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId, onlyHash } = req.body;

    try {
      let data = await TStation.findOne({
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title'],
        where: { St_ID: stationId },
        include: [{
          model: TStationTrack,
          attributes: ['ST_ID', 'ST_Name'],
        },
        {
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name', 'SWP_Type'],
        }],
      });

      if (onlyHash) {
        const serializedData = JSON.stringify(data);
        data = crypto.createHash('md5').update(serializedData).digest('hex');
      }
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации о станции (+ пути)',
        error: error.message,
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
 * stationIds - массив id станций (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/shortDefinitData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DEFINIT_STATIONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDefiniteStationsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationIds } = req.body;

    try {
      const data = await TStation.findAll({
        raw: true,
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title'],
        where: { St_ID: stationIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка станций по заданным id этих станций',
        error: error.message,
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
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_DEFINIT_STATIONS_WORK_PLACES; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationIds } = req.body;

    try {
      const filter = {
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title'],
        include: [{
          model: TStationWorkPlace,
          attributes: ['SWP_ID', 'SWP_Name', 'SWP_Type'],
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
        error: error.message,
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
 * GID_ESRCode - ЕСР-код ГИД станции (обязателен),
 * name - наименование станции (обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_STATION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { ESRCode, GID_ESRCode, name } = req.body;

    try {
      // Ищем в БД станцию, ESRCode которой совпадает с переданным пользователем
      const candidate = await TStation.findOne({ where: { St_UNMC: ESRCode } });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Станция с таким ЕСР-кодом уже существует' });
      }

      // Создаем в БД запись с данными о новой станции
      const station = await TStation.create({
        St_UNMC: ESRCode,
        St_GID_UNMC: GID_ESRCode,
        St_Title: name,
        St_LastPersonalUpdateTime: new Date(),
      });

      res.status(OK).json({ message: SUCCESS_ADD_MESS, station });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление новой станции',
        error: error.message,
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
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_STATION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
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

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      try { await t.rollback(); } catch {}
      addError({
        errorTime: new Date(),
        action: 'Удаление станции',
        error: error.message,
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
 * GID_ESRCode - ЕСР-код ГИД станции (не обязателен),
 * name - наименование станции (не обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_STATION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, ESRCode, GID_ESRCode, name } = req.body;

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
      if (req.body.hasOwnProperty('GID_ESRCode')) {
        updateFields.St_GID_UNMC = GID_ESRCode;
      }
      if (req.body.hasOwnProperty('name')) {
        updateFields.St_Title = name;
      }

      await TStation.update(updateFields, {
        where: {
          St_ID: id,
        },
      });

      res.status(OK).json({ message: SUCCESS_MOD_RES });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о станции',
        error: error.message,
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
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/syncWithPENSI',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.SYNC_STATIONS_WITH_PENSI; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
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
      const { getResponseEncoding } = require('../http/getResponseEncoding');
      const PENSIServerAddress = config.get('PENSI.serverAddress');
      const roadCode = config.get('PENSI.roadCode');
      const additionalStationsCodes = config.get('PENSI.additionalStationsCodes');

      // Из ПЭНСИ получаем для Бел.ж.д. (код дороги = 13) следующую информацию по станциям: id (будет передан
      // вне зависимости от его присутствия в запросе), ЕСР-код станции, наименование станции.
      // Данные запрашиваем без учета истории их изменения. Т.е. придут только актуальные данные (history=0).
      stationsDataHTTPRequest =
        `http://${PENSIServerAddress}/WEBNSI/download.jsp?tab=NSIVIEW.STA&cols=STA_NO,STA_NAME&history=0` +
        `&filter=ROAD_NO=${roadCode}+OR+ST%23UN+IN+(${additionalStationsCodes.join(',')})`;

      // Вначале пытаюсь получить данные от ПЭНСИ
      let response = await fetch(stationsDataHTTPRequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);
      const responseEncoding = getResponseEncoding(response);

      // Затем декодирую полученные данные
      let buffer = await response.arrayBuffer();
      const decoder = new TextDecoder(responseEncoding);
      const stationsPENSIString = decoder.decode(buffer); // строка со всеми данными по станциям от ПЭНСИ

      // После этого извлекаю данные по станциям из своей БД
      const localStationsData = await TStation.findAll({
        attributes: ['St_ID', 'St_UNMC', 'St_GID_UNMC', 'St_Title', 'St_PENSI_ID', 'St_PENSI_UNMC'],
        transaction: t,
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

      let syncResults = []; // для возврата запросившему операцию синхронизации (массив строк с результатами)

      // Для каждой записи из ПЭНСИ нахожу соответствующую свою и сравниваю значения их полей.
      // Если не совпадают - меняю. Если совпадения нет - создаю у себя новую запись.
      let correspLocalRecord;
      const modifiedRecs = [];
      const addedRecs = [];
      for (let pensiRecord of pensiStationsArray) {
        correspLocalRecord = localStationsData.find((el) => el.St_PENSI_ID === pensiRecord.stationId);
        if (correspLocalRecord) {
          let needsToBeSaved = false;
          let changedData = `${correspLocalRecord.St_Title}: `;
          if (correspLocalRecord.St_Title !== pensiRecord.stationName) {
            changedData += `${pensiRecord.stationName} (ранее ${correspLocalRecord.St_Title});`;
            correspLocalRecord.St_Title = pensiRecord.stationName;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.St_PENSI_UNMC !== pensiRecord.stationCode) {
            changedData += `${pensiRecord.stationCode} (ранее ${correspLocalRecord.St_PENSI_UNMC});`;
            correspLocalRecord.St_PENSI_UNMC = pensiRecord.stationCode;
            needsToBeSaved = true;
          }
          if (needsToBeSaved) {
            modifiedRecs.push(changedData);
            correspLocalRecord.save();
          }
        } else {
          await TStation.create({
            St_UNMC: pensiRecord.stationCode,
            St_GID_UNMC: pensiRecord.stationCode,
            St_Title: pensiRecord.stationName,
            St_PENSI_ID: pensiRecord.stationId,
            St_PENSI_UNMC: pensiRecord.stationCode,
          }, { transaction: t });
          addedRecs.push(`${pensiRecord.stationName} (${pensiRecord.stationCode})`);
        }
      }
      if (modifiedRecs.length > 0) {
        syncResults.push('Отредактирована информация по станциям:', ...modifiedRecs);
      }
      if (addedRecs.length > 0) {
        syncResults.push('Добавлены станции:', ...addedRecs);
      }
      // Осталось отметить те станции в локальной БД, которых не было обнаружено в ПЭНСИ
      const onlyLocalStations = localStationsData.filter((el) =>
        !pensiStationsArray.find((item) => el.St_PENSI_ID === item.stationId));
      if (onlyLocalStations.length) {
        syncResults.push('Станции, информация по которым не получена от ПЭНСИ:');
        syncResults.push(onlyLocalStations.map((station) => `${station.St_Title} (${station.St_UNMC})`).join('; '));
      }

      await t.commit();

      syncResults = syncResults.length ? ['Информация успешно синхронизирована', ...syncResults] :
        ['Информация синхронизирована'];
      res.status(OK).json({
        message: syncResults.length > 1 ? 'Информация успешно синхронизирована' : 'Информация синхронизирована',
        syncResults,
      });

      // Логируем действие пользователя
      addAdminActionInfo({
        user: userPostFIOString(req.user),
        actionTime: new Date(),
        action: 'Синхронизация таблицы станций с ПЭНСИ',
        actionParams: { syncResults },
      });

    } catch (error) {
      try { await t.rollback(); } catch {}
      addError({
        errorTime: new Date(),
        action: 'Синхронизация таблицы станций с ПЭНСИ',
        error: error.message,
        actionParams: { stationsDataHTTPRequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
