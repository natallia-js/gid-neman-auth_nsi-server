const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const {
  getDefiniteDNCSectorValidationRules,
  getDefiniteDNCSectorsValidationRules,
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
} = require('../validators/dncSectors.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TDNCSector } = require('../models/TDNCSector');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TDNCTrainSectorStation } = require('../models/TDNCTrainSectorStation');
const { TStationTrack } = require('../models/TStationTrack');
const { TBlockTrack } = require('../models/TBlockTrack');
const deleteDNCSector = require('../routes/deleteComplexDependencies/deleteDNCSector');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  DATA_TO_DEL_NOT_FOUND,

  GET_ALL_DNCSECTORS_ACTION,
  MOD_DNCSECTOR_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ со вложенными списками поездных участков,
 * которые, в свою очередь, содержат вложенные списки станций и перегонов.
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
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (_req, res) => {
    try {
      const data = await TDNCSector.findAll({
        attributes: ['DNCS_ID', 'DNCS_Title', 'DNCS_DESCRIPTION', 'DNCS_PENSI_ID'],
        include: [
          {
            model: TDNCTrainSector,
            as: 'TDNCTrainSectors',
            attributes: ['DNCTS_ID', 'DNCTS_Title', 'DNCTS_DNCSectorID'],
            include: [
              {
                model: TStation,
                as: 'TStations',
              },
              {
                model: TBlock,
                as: 'TBlocks',
              },
            ],
          },
        ],
      });
      res.status(OK).json(data ? data.map(d => d.dataValues) : []);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех участков ДНЦ',
        error,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ и только, без вложенных списков поездных участков.
 *
 * Данный запрос доступен любому лицу.
 */
 router.get(
  '/shortData',
  async (_req, res) => {
    try {
      const data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение простого списка всех участков ДНЦ',
        error,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ДНЦ (со вложенными списками поездных участков)
 * для заданной станции. Т.е. извлекаются только те участки ДНЦ, в составе поездных участков которых
 * присутствует указанная станция.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * stationId - id станции (обязателен)
 */
 router.post(
  '/shortStationData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { stationId } = req.body;

    try {
      const dncTrainSectorsConnections = await TDNCTrainSectorStation.findAll({
        raw: true,
        attributes: ['DNCTSS_TrainSectorID', 'DNCTSS_StationID', 'DNCTSS_StationBelongsToDNCSector'],
        where: { DNCTSS_StationID: stationId },
      }) || [];
      const dncTrainSectors = await TDNCTrainSector.findAll({
        raw: true,
        attributes: ['DNCTS_ID', 'DNCTS_Title', 'DNCTS_DNCSectorID'],
        where: { DNCTS_ID: dncTrainSectorsConnections.map((item) => item.DNCTSS_TrainSectorID) },
      }) || [];
      const dncSectors = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncTrainSectors.map((item) => item.DNCTS_DNCSectorID) },
      });

      const data = dncSectors.map((dncSector) => {
        return {
          ...dncSector,
          TTrainSectors: dncTrainSectors
            .filter((item) => item.DNCTS_DNCSectorID === dncSector.DNCS_ID)
            .map((item) => {
              return {
                DNCTS_ID: item.DNCTS_ID,
                DNCTS_Title: item.DNCTS_Title,
                stationBelongsToDNCSector: dncTrainSectorsConnections.find(
                  (el) => el.DNCTSS_TrainSectorID === item.DNCTS_ID).DNCTSS_StationBelongsToDNCSector,
              };
            }),
        };
      });

      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка участков ДНЦ заданной станции',
        error,
        actionParams: { stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение конкретного участка ДНЦ со вложенными списками поездных участков,
 * которые, в свою очередь, содержат вложенные списки станций и перегонов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ДНЦ (обязателен)
 */
 router.post(
  '/definitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  getDefiniteDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    const { sectorId } = req.body;

    try {
      const data = await TDNCSector.findOne({
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: sectorId },
        include: [
          {
            model: TDNCTrainSector,
            as: 'TDNCTrainSectors',
            attributes: ['DNCTS_ID', 'DNCTS_Title'],
            include: [
              {
                model: TStation,
                as: 'TStations',
                attributes: ['St_ID', 'St_UNMC', 'St_Title'],
                include: [
                  // TDNCTrainSectorStation включается в выборку здесь автоматически, ничего писать не
                  // нужно. Если написать, будут ошибки. Это промежуточная таблица в отношении many-to-many
                  {
                    model: TStationTrack,
                    as: 'TStationTracks',
                    attributes: ['ST_ID', 'ST_Name'],
                  },
                ],
              },
              {
                model: TBlock,
                as: 'TBlocks',
                attributes: ['Bl_ID', 'Bl_Title', 'Bl_StationID1', 'Bl_StationID2'],
                include: [
                  // TDNCTrainSectorBlock включается в выборку здесь автоматически, ничего писать не
                  // нужно. Если написать, будут ошибки. Это промежуточная таблица в отношении many-to-many
                  {
                    model: TBlockTrack,
                    as: 'TBlockTracks',
                    attributes: ['BT_ID', 'BT_Name'],
                  },
                ],
              },
            ],
          },
        ],
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение конкретного участка ДНЦ',
        error,
        actionParams: { sectorId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка участков ДНЦ и только, без вложенных списков поездных участков,
 * по id этих участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * dncSectorIds - массив id участков ДНЦ (обязателен)
 */
 router.post(
  '/shortDefinitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_DNCSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  getDefiniteDNCSectorsValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { dncSectorIds } = req.body;

    try {
      const data = await TDNCSector.findAll({
        raw: true,
        attributes: ['DNCS_ID', 'DNCS_Title'],
        where: { DNCS_ID: dncSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка конкретных участков ДНЦ',
        error,
        actionParams: { dncSectorIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование участка ДНЦ (обязательно),
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  addDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { name } = req.body;

    try {
      // Ищем в БД участок ДНЦ, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TDNCSector.findOne({ where: { DNCS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Участок ДНЦ с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом участке ДНЦ
      const sector = await TDNCSector.create({ DNCS_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового участка ДНЦ',
        error,
        actionParams: { name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id участка (обязателен)
  */
router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  delDNCSectorValidationRules(),
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
      const deletedCount = await deleteDNCSector(id, t);

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
        action: 'Удаление участка ДНЦ',
        error,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации об участке ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор участка (обязателен),
 * name - наименование участка (не обязательно),
 */
router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка параметров запроса
  modDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, name } = req.body;

    try {
      // Ищем в БД участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TDNCSector.findOne({ where: { DNCS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.DNCS_ID !== candidate.DNCS_ID)) {
          return res.status(ERR).json({ message: 'Участок ДНЦ с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.DNCS_Title = name;
      }

      await TDNCSector.update(updateFields, {
        where: {
          DNCS_ID: id,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации об участке ДНЦ',
        error,
        actionParams: { id, name },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на синхронизацию списка всех участков ДНЦ со списком участков ДНЦ ПЭНСИ.
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
      creds: [MOD_DNCSECTOR_ACTION],
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

    let dncSectorsDataHTTPRequest = '';

    try {
      const fetch = require('node-fetch');
      const config = require('config');

      const checkStatus = require('../http/checkStatus');
      const PENSIServerAddress = config.get('PENSI.serverAddress');
      const responseEncoding = config.get('PENSI.responseEncoding'); // кодировка, в которой ПЭНСИ передает данные

      // Из ПЭНСИ получаем следующую информацию по участкам ДНЦ: id (будет передан вне зависимости от его
      // присутствия в запросе), наименование участка, комментарий к записи.
      // Данные запрашиваем без учета истории их изменения. Т.е. придут только актуальные данные (history=0).
      dncSectorsDataHTTPRequest =
        `http://${PENSIServerAddress}/WEBNSI/download.jsp?tab=NSIVIEW.DISPATCH_REGION&cols=DISP_REG_NAME,DISP_REG_NOTE&history=0`;

      // Вначале пытаюсь получить данные от ПЭНСИ
      let response = await fetch(dncSectorsDataHTTPRequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);

      // Затем декодирую полученные данные
      let buffer = await response.arrayBuffer();
      const decoder = new TextDecoder(responseEncoding);
      const dncSectorsPENSIString = decoder.decode(buffer); // строка со всеми данными по участкам ДНЦ от ПЭНСИ

      // После этого извлекаю данные по участкам ДНЦ из своей БД
      const localDNCSectorsData = await TDNCSector.findAll({
        attributes: ['DNCS_ID', 'DNCS_Title', 'DNCS_DESCRIPTION', 'DNCS_PENSI_ID'],
      });

      // Имея все данные, сравниваю их и вношу необходимые изменения в свою БД

      // Формирую массив подстрок исходной строки данных от ПЭНСИ
      const allRows = dncSectorsPENSIString.split(/\r?\n|\r/);
      // Теперь данные от ПЭНСИ положу в массив для удобства работы с ними
      const pensiDNCSectorsArray = [];
      for (let singleRow = 1; singleRow < allRows.length; singleRow += 1) {
        const rowCells = allRows[singleRow].split(';');
        if (rowCells.length < 3) {
          continue;
        }
        pensiDNCSectorsArray.push({
          sectorId: +rowCells[0], // строку с id участка - в числовое значение
          sectorName: rowCells[1].replace(/"/g,''), // из строки '"Наименование"' делаем 'Наименование'
          sectorNote: rowCells[2].replace(/"/g,''), // из строки '"Комментарий"' делаем 'Комментарий'
        });
      }

      // Для каждой своей записи нахожу соответствующую из ПЭНСИ и сравниваю значения их полей.
      // Если не совпадают - меняю.
      let correspLocalRecord;
      for (let pensiRecord of pensiDNCSectorsArray) {
        correspLocalRecord = localDNCSectorsData.find((el) => el.DNCS_Title === pensiRecord.sectorName);
        if (correspLocalRecord) {
          correspLocalRecord.DNCS_PENSI_ID = pensiRecord.sectorId;
          correspLocalRecord.DNCS_DESCRIPTION = pensiRecord.sectorNote;
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
        action: 'Синхронизация таблицы участков ДНЦ с ПЭНСИ',
        error,
        actionParams: { dncSectorsDataHTTPRequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
