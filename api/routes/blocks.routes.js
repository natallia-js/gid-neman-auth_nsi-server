const { Router } = require('express');
const crypto = require('crypto');
const {
  getStationBlocksValidationRules,
  addBlockValidationRules,
  delBlockValidationRules,
  modBlockValidationRules,
} = require('../validators/blocks.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TBlock } = require('../models/TBlock');
const { TStation } = require('../models/TStation');
const { TStationTrack } = require('../models/TStationTrack');
const { TBlockTrack } = require('../models/TBlockTrack');
const deleteBlock = require('../routes/deleteComplexDependencies/deleteBlock');
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
  SUCCESS_DEL_MESS,
  SUCCESS_MOD_RES,
  SUCCESS_ADD_MESS,
  DATA_TO_DEL_NOT_FOUND,
  DATA_TO_MOD_NOT_FOUND,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех перегонов, без вложенной информации о станциях и путях.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/shortData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_BLOCKS_SHORT_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TBlock.findAll({
        raw: true,
        attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2', 'Bl_PENSI_DNCSectorCode'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение простого списка всех перегонов',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех перегонов, включая вложенные объекты станций
 * (без путей) и путей перегонов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_BLOCKS_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await TBlock.findAll({
        attributes: ['Bl_ID', 'Bl_Title', 'Bl_PENSI_ID', 'Bl_PENSI_DNCSectorCode'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TBlockTrack,
          attributes: ['BT_ID', 'BT_Name'],
        }],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех перегонов с соответствующими станциями и путями перегонов',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех перегонов заданной станции.
 * В выборку включаются объекты соседних станций с путями, а также пути перегонов.
 *
 * Параметры тела запроса:
 * stationId - id станции (обязателен),
 * onlyHash - если true, то ожидается, что запрос вернет только хэш-значение информации о перегонах станции,
 *   если false, то запрос возвращает всю запрошенную информацию о перегонах станции
 *   (параметр не обязателен; если не указан, то запрос возвращает информацию о запрашиваемых перегонах)
 * Обязательный параметр запроса - applicationAbbreviation!
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.post(
  '/stationData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_STATION_BLOCKS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getStationBlocksValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId, onlyHash } = req.body;

    try {
      let data = await TBlock.findAll({
        attributes: ['Bl_ID', 'Bl_Title'],
        where: {
          [Op.or]: [{ Bl_StationID1: stationId }, { Bl_StationID2: stationId }],
        },
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
          include: [{
            model: TStationTrack,
            attributes: ['ST_ID', 'ST_Name'],
          }],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
          include: [{
            model: TStationTrack,
            attributes: ['ST_ID', 'ST_Name'],
          }],
        }, {
          model: TBlockTrack,
          attributes: ['BT_ID', 'BT_Name'],
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
        action: 'Получение списка всех перегонов заданной станции',
        error: error.message,
        actionParams: { stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование перегона (обязательно),
 * station1 - id станции 1 (обязателен),
 * station2 - id станции 2 (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_BLOCK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addBlockValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { name, station1, station2 } = req.body;

    try {
      // Ищем в БД перегон, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TBlock.findOne({ where: { Bl_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Перегон с таким наименованием уже существует' });
      }

      // Ищем в БД перегон, ограниченный указанными в запросе станциями (не допускаем присутствие
      // в базе перегонов типа А - Б и Б - А, т.к. это один и тот же перегон, следовательно, будет
      // дублирование связанной с ним информации)
      antiCandidate = await TBlock.findOne({
        where: {
          [Op.or]: [
            {
              [Op.and]: [
                { Bl_StationID1: station1 },
                { Bl_StationID2: station2 },
              ],
            },
            {
              [Op.and]: [
                { Bl_StationID1: station2 },
                { Bl_StationID2: station1 },
              ],
            },
          ],
        },
      });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Перегон, ограниченный указанными станциями, уже существует' });
      }

      // Ищем станции с указанными в запросе id
      const stationsToBind = await TStation.findAll({
        where: {
          [Op.or]: [
            { St_ID: station1 },
            { St_ID: station2 },
          ],
        },
      });
      if (
        !stationsToBind ||
        (station1 === station2 && stationsToBind.length < 1) ||
        (station1 !== station2 && stationsToBind.length < 2)) {
        return res.status(ERR).json({ message: 'Указанная(-ые) станция(-ии) не существует(-ют) в базе' });
      }

      // Создаем в БД запись с данными о новом перегоне
      const block = await TBlock.create({ Bl_Title: name, Bl_StationID1: station1, Bl_StationID2: station2 });

      // Возвращаю полную информацию о созданном перегоне, включая информацию о его граничных станциях
      const dataToReturn = await TBlock.findOne({
        where: { Bl_ID: block.Bl_ID },
        attributes: ['Bl_ID', 'Bl_Title'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }],
      });

      res.status(OK).json({ message: SUCCESS_ADD_MESS, block: dataToReturn });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового перегона',
        error: error.message,
        actionParams: { name, station1, station2 },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление перегона.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id перегона (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
  */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_BLOCK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delBlockValidationRules(),
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
      const deletedCount = await deleteBlock(id, t);

      if (!deletedCount) {
        await t.rollback();
        return res.status(ERR).json({ message: DATA_TO_DEL_NOT_FOUND });
      }

      await t.commit();

      res.status(OK).json({ message: SUCCESS_DEL_MESS });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Удаление перегона',
        error: error.message,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о перегоне.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор перегона (обязателен),
 * name - наименование перегона (не обязательно),
 * station1 - id станции 1 (не обязателен),
 * station2 - id станции 2 (не обязателен),
 * pensiDNCSectorCode - код участка ДНЦ, которому принадлежит перегон,
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_BLOCK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modBlockValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name, station1, station2, pensiDNCSectorCode } = req.body;

    try {
      // Ищем в БД перегон, id которого совпадает с переданным пользователем
      const candidate = await TBlock.findOne({ where: { Bl_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный перегон не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование перегона, то ищем в БД перегон, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TBlock.findOne({ where: { Bl_Title: name } });

        // Если находим, то смотрим, тот ли это самый перегон. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.Bl_ID !== candidate.Bl_ID)) {
          return res.status(ERR).json({ message: 'Перегон с таким наименованием уже существует' });
        }
      }

      if (station1 || station2) {
        const st1Id = station1 || candidate.Bl_StationID1;
        const st2Id = station2 || candidate.Bl_StationID2;

        // Ищем в БД перегон, ограниченный указанными в запросе станциями (не допускаем присутствие
        // в базе перегонов типа А - Б и Б - А, т.к. это один и тот же перегон, следовательно, будет
        // дублирование связанной с ним информации)
        const antiCandidate = await TBlock.findOne({
          where: {
            [Op.or]: [
              {
                [Op.and]: [
                  { Bl_StationID1: st1Id },
                  { Bl_StationID2: st2Id },
                ],
              },
              {
                [Op.and]: [
                  { Bl_StationID1: st2Id },
                  { Bl_StationID2: st1Id },
                ],
              },
            ],
          },
        });
        // Если находим, то процесс создания продолжать не можем
        if (antiCandidate) {
          return res.status(ERR).json({ message: 'Перегон, ограниченный указанными станциями, уже существует' });
        }

        // Ищем станции с указанными в запросе id
        const conditionArr = [];
        if (station1) {
          conditionArr.push({ St_ID: station1 });
        }
        if (station2) {
          conditionArr.push({ St_ID: station2 });
        }

        if (conditionArr.length) {
          const stationsToBind = await TStation.findAll({
            where: {
              [Op.or]: conditionArr,
            },
          });
          if (
            !stationsToBind ||
            (station1 === station2 && stationsToBind.length < 1) ||
            (station1 !== station2 && stationsToBind.length < conditionArr.length)) {
            return res.status(ERR).json({ message: 'Указанная(-ые) станция(-ии) не существует(-ют) в базе' });
          }
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.Bl_Title = name;
      }
      if (req.body.hasOwnProperty('station1')) {
        updateFields.Bl_StationID1 = station1;
      }
      if (req.body.hasOwnProperty('station2')) {
        updateFields.Bl_StationID2 = station2;
      }
      if (req.body.hasOwnProperty('pensiDNCSectorCode')) {
        updateFields.Bl_PENSI_DNCSectorCode = pensiDNCSectorCode;
      }

      const updateRes = await TBlock.update(updateFields, {
        where: {
          Bl_ID: id,
        },
      });

      if (!updateRes[0]) {
        return res.status(ERR).json({ message: DATA_TO_MOD_NOT_FOUND });
      }

      // Возвращаю полную информацию о созданном перегоне, включая информацию о его граничных станциях
      const dataToReturn = await TBlock.findOne({
        where: { Bl_ID: id },
        attributes: ['Bl_ID', 'Bl_Title', 'Bl_PENSI_ID', 'Bl_PENSI_DNCSectorCode'],
        include: [{
          model: TStation,
          as: 'station1',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TStation,
          as: 'station2',
          attributes: ['St_ID', 'St_UNMC', 'St_Title'],
        }, {
          model: TBlockTrack,
          attributes: ['BT_ID', 'BT_Name'],
        }],
      });

      res.status(OK).json({ message: SUCCESS_MOD_RES, block: dataToReturn });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о перегоне',
        error: error.message,
        actionParams: { id, name, station1, station2 },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на синхронизацию списка всех перегонов со списком перегонов ПЭНСИ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/syncWithPENSI',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.SYNC_BLOCKS_WITH_PENSI; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции синхронизации не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    let blocksDataHTTPRequest = '';

    try {
      const fetch = require('node-fetch');
      const config = require('config');

      const checkStatus = require('../http/checkStatus');
      const { getResponseEncoding } = require('../http/getResponseEncoding');
      const PENSIServerAddress = config.get('PENSI.serverAddress');
      const roadCode = config.get('PENSI.roadCode');

      // Из ПЭНСИ получаем следующую информацию по перегонам: id (будет передан вне зависимости от его
      // присутствия в запросе), наименование перегона, ЕСР-коды ограничивающих станций, код соответствующего участка ДНЦ.
      // Данные запрашиваем без учета истории их изменения. Т.е. придут только актуальные данные (history=0).
      blocksDataHTTPRequest =
        `http://${PENSIServerAddress}/WEBNSI/download.jsp?tab=NSIVIEW.PRED_RPP&cols=RPP_NAME,PRED_STA_NO_1,PRED_STA_NO_2,DISP_REG_NO&history=0` +
        `&filter=(PRED_STA_NAME_2<>'')+AND+(ROAD_NO=${roadCode}+OR+(ROAD_NO=0+AND+DISP_REG_NO<>0))`;

      // Вначале пытаюсь получить данные от ПЭНСИ
      let response = await fetch(blocksDataHTTPRequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);
      const responseEncoding = getResponseEncoding(response);

      // Затем декодирую полученные данные
      let buffer = await response.arrayBuffer();
      const decoder = new TextDecoder(responseEncoding);
      const blocksPENSIString = decoder.decode(buffer); // строка со всеми данными по перегонам от ПЭНСИ

      // После этого извлекаю данные по перегонам из своей БД
      const localBlocksData = await TBlock.findAll({
        attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2', 'Bl_PENSI_ID', 'Bl_PENSI_DNCSectorCode'],
        transaction: t,
      });

      // Имея все данные, сравниваю их и вношу необходимые изменения в свою БД

      // Формирую массив подстрок исходной строки данных от ПЭНСИ
      const allRows = blocksPENSIString.split(/\r?\n|\r/);
      // Теперь данные от ПЭНСИ положу в массив для удобства работы с ними
      const pensiBlocksArray = [];
      for (let singleRow = 1; singleRow < allRows.length; singleRow += 1) {
        const rowCells = allRows[singleRow].split(';');
        if (rowCells.length < 5) {
          continue;
        }
        pensiBlocksArray.push({
          blockId: +rowCells[0], // строку с id перегона - в числовое значение
          blockName: rowCells[1].replace(/"/g,''), // из строки '"Наименование"' делаем 'Наименование'
          station1: rowCells[2].replace(/"/g,''), // из строки '"Код станции"' делаем 'Код станции'
          station2: rowCells[3].replace(/"/g,''), // из строки '"Код станции"' делаем 'Код станции'
          dncSectorCode: +rowCells[4], // строку с кодом участка ДНЦ - в числовое значение
        });
      }

      let syncResults = []; // для возврата запросившему операцию синхронизации (массив строк с результатами)

      const getStationId_By_PENSI_UNMCCode = async (unmcCode) => {
        const stationObject = await TStation.findOne({ where: { St_PENSI_UNMC: unmcCode }, transaction: t });
        return stationObject ? stationObject.St_ID : null;
      };

      // Для каждой записи из ПЭНСИ нахожу соответствующую свою и сравниваю значения их полей.
      // Если не совпадают - меняю. Если совпадения нет - создаю у себя новую запись.
      // Т.к. ПЭНСИ передает ЕСР-коды станций для перегонов, то по этом кодам пытаюсь отыскать
      // станцию в нашей БД. Если не нахожу, то соответствующую запись о перегоне не создаю, уже
      // созданную запись не редактирую.
      let correspLocalRecord;
      const modifiedRecs = [];
      const addedRecs = [];
      const impossibleRecs = [];
      let station1Id;
      let station2Id;
      for (let pensiRecord of pensiBlocksArray) {
        correspLocalRecord = localBlocksData.find((el) => el.Bl_PENSI_ID === pensiRecord.blockId);
        station1Id = await getStationId_By_PENSI_UNMCCode(pensiRecord.station1);
        station2Id = await getStationId_By_PENSI_UNMCCode(pensiRecord.station2);
        if (!station1Id || !station2Id) {
          impossibleRecs.push(`Запись о перегоне ${pensiRecord.blockName} не может быть ` +
          `${correspLocalRecord ? 'отредактирована' : 'создана'}: ` +
          `для ЕСР-${(!station1Id && !station2Id) ? 'кодов ' + pensiRecord.station1 + ', ' + pensiRecord.station2 : 'кода ' + pensiRecord.station1 ?? pensiRecord.station2} ` +
          `не найден${(!station1Id && !station2Id) ? 'ы соответствующие станции' : 'а соответствующая станция'}`);
          continue;
        }
        if (correspLocalRecord) {
          // Проверяю, существует ли перегон со станциями, имеющими id station1Id и station2Id,
          // отличный от текущего. Если да, то не редактирую текущий (иначе БД выдаст исключение)
          const blockObject = await TBlock.findOne({
            where: {
              Bl_StationID1: station1Id,
              Bl_StationID2: station2Id,
              Bl_ID: { [Op.ne]: correspLocalRecord.Bl_ID },
            },
            transaction: t,
          });
          if (blockObject) {
            impossibleRecs.push(`Запись о перегоне ${correspLocalRecord.Bl_Title} не отредактирована: в БД уже есть перегон со станциями с кодами ${pensiRecord.station1} и ${pensiRecord.station2}`);
            continue;
          }
          let needsToBeSaved = false;
          let changedData = `${correspLocalRecord.Bl_Title}: `;
          if (correspLocalRecord.Bl_Title !== pensiRecord.blockName) {
            changedData += `${pensiRecord.blockName} (ранее ${correspLocalRecord.Bl_Title});`;
            correspLocalRecord.Bl_Title = pensiRecord.blockName;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.Bl_PENSI_DNCSectorCode !== pensiRecord.dncSectorCode) {
            changedData += `код участка ДНЦ ${pensiRecord.dncSectorCode} (ранее ${correspLocalRecord.Bl_PENSI_DNCSectorCode});`;
            correspLocalRecord.Bl_PENSI_DNCSectorCode = pensiRecord.dncSectorCode;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.Bl_StationID1 !== station1Id) {
            changedData += `id станции ${station1Id} (ранее ${correspLocalRecord.Bl_StationID1});`;
            correspLocalRecord.Bl_StationID1 = station1Id;
            needsToBeSaved = true;
          }
          if (correspLocalRecord.Bl_StationID2 !== station2Id) {
            changedData += `id станции ${station2Id} (ранее ${correspLocalRecord.Bl_StationID2});`;
            correspLocalRecord.Bl_StationID2 = station2Id;
            needsToBeSaved = true;
          }
          if (needsToBeSaved) {
            modifiedRecs.push(changedData);
            correspLocalRecord.save();
          }
        } else {
          // Проверяю, существует ли перегон со станциями, имеющими id station1Id и station2Id.
          // Если да, то не создаю новый с такими же кодами (иначе БД выдаст исключение)
          const blockObject = await TBlock.findOne({
            where: {
              Bl_StationID1: station1Id,
              Bl_StationID2: station2Id,
            },
            transaction: t,
          });
          if (blockObject) {
            impossibleRecs.push(`Запись о перегоне ${pensiRecord.blockName} не добавлена: в БД уже есть перегон со станциями с кодами ${pensiRecord.station1} и ${pensiRecord.station2}`);
            continue;
          }
          await TBlock.create({
            Bl_Title: pensiRecord.blockName,
            Bl_StationID1: station1Id,
            Bl_StationID2: station2Id,
            Bl_PENSI_ID: pensiRecord.blockId,
            Bl_PENSI_DNCSectorCode: pensiRecord.dncSectorCode,
          }, { transaction: t });
          addedRecs.push(pensiRecord.blockName);
        }
      }
      if (modifiedRecs.length > 0) {
        syncResults.push('Отредактирована информация по перегонам:', ...modifiedRecs);
      }
      if (addedRecs.length > 0) {
        syncResults.push('Добавлены перегоны:', ...addedRecs);
      }
      if (impossibleRecs.length > 0) {
        syncResults.push('Проблемы с созданием / редактированием перегонов:', ...impossibleRecs);
      }
      // Осталось отметить те перегоны в локальной БД, которых не было обнаружено в ПЭНСИ
      const onlyLocalBlocks = localBlocksData.filter((el) =>
        !pensiBlocksArray.find((item) => el.Bl_PENSI_ID === item.blockId));
      if (onlyLocalBlocks.length) {
        syncResults.push('Перегоны, информация по которым не получена от ПЭНСИ:');
        syncResults.push(onlyLocalBlocks.map((block) => block.Bl_Title).join('; '));
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
        action: 'Синхронизация таблицы перегонов с ПЭНСИ',
        actionParams: { syncResults },
      });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Синхронизация таблицы перегонов с ПЭНСИ',
        error: error.message,
        actionParams: { blocksDataHTTPRequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
