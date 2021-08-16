const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  getDefiniteECDSectorValidationRules,
  getDefiniteECDSectorsValidationRules,
  addECDSectorValidationRules,
  delECDSectorValidationRules,
  modECDSectorValidationRules,
} = require('../validators/ecdSectors.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TECDSector } = require('../models/TECDSector');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TAdjacentECDSector } = require('../models/TAdjacentECDSector');
const { TNearestDNCandECDSector } = require('../models/TNearestDNCandECDSector');
const { TECDTrainSectorStation } = require('../models/TECDTrainSectorStation');
const { TStationTrack } = require('../models/TStationTrack');
const { TBlockTrack } = require('../models/TBlockTrack');
const { Op } = require('sequelize');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_ECDSECTORS_ACTION,
  MOD_ECDSECTOR_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех участков ЭЦД со вложенными списками поездных участков,
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
      creds: [GET_ALL_ECDSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TECDSector.findAll({
        attributes: ['ECDS_ID', 'ECDS_Title'],
        include: [
          {
            model: TECDTrainSector,
            as: 'TECDTrainSectors',
            attributes: ['ECDTS_ID', 'ECDTS_Title', 'ECDTS_ECDSectorID'],
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
      res.status(OK).json(data.map(d => d.dataValues));

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ЭЦД и только, без вложенных списков поездных участков.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.get(
  '/shortData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ECDSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех участков ЭЦД со вложенными списками поездных участков,
 * которые, в свою очередь, содержат вложенные списки станций и перегонов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorId - id участка ЭЦД (обязателен)
 */
 router.post(
  '/definitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ECDSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  getDefiniteECDSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      const { sectorId } = req.body;

      const data = await TECDSector.findOne({
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: sectorId },
        include: [
          {
            model: TECDTrainSector,
            as: 'TECDTrainSectors',
            attributes: ['ECDTS_ID', 'ECDTS_Title'],
            include: [
              {
                model: TStation,
                as: 'TStations',
                attributes: ['St_ID', 'St_UNMC', 'St_Title'],
                include: [
                  // TECDTrainSectorStation включается в выборку здесь автоматически, ничего писать не
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
                  // TECDTrainSectorBlock включается в выборку здесь автоматически, ничего писать не
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
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка участков ЭЦД и только, без вложенных списков поездных участков,
 * по id этих участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * ecdSectorIds - массив id участков ЭЦД (обязателен)
 */
 router.post(
  '/shortDefinitData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ECDSECTORS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  getDefiniteECDSectorsValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { ecdSectorIds } = req.body;

      const data = await TECDSector.findAll({
        raw: true,
        attributes: ['ECDS_ID', 'ECDS_Title'],
        where: { ECDS_ID: ecdSectorIds },
      });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование участка ЭЦД (обязательно),
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addECDSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { name } = req.body;

      // Ищем в БД участок ЭЦД, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TECDSector.findOne({ where: { ECDS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Участок ЭЦД с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом участке ЭЦД
      const sector = await TECDSector.create({ ECDS_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление участка ЭЦД.
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
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delECDSectorValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции удаления не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id } = req.body;

      // Ищем в БД участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDSector.findOne({
        where: { ECDS_ID: id },
        transaction: t,
      });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе данных' });
      }

      // Перед удалением участка ЭЦД ищем все его поездные участки ЭЦД: для соответствующих записей
      // необходимо удалить информацию из таблицы станций поездных участков ЭЦД
      const ecdTrainSectors = await TECDTrainSector.findAll({
        where: { ECDTS_ECDSectorID: id },
        transaction: t,
      });

      // Удаляем в БД запись и все связанные с нею записи в других таблицах (порядок имеет значение!)
      await TAdjacentECDSector.destroy({
        where: {
          [Op.or]: [
            { AECDS_ECDSectorID1: id },
            { AECDS_ECDSectorID2: id },
          ],
        },
        transaction: t,
      });
      await TNearestDNCandECDSector.destroy({
        where: { NDE_ECDSectorID: id },
        transaction: t,
      });
      if (ecdTrainSectors && ecdTrainSectors.length) {
        await TECDTrainSectorStation.destroy({
          where: { ECDTSS_TrainSectorID: ecdTrainSectors.map(el => el.ECDTS_ID) },
          transaction: t,
        });
        await TECDTrainSector.destroy({
          where: { ECDTS_ECDSectorID: id },
          transaction: t,
        });
      }
      await TECDSector.destroy({ where: { ECDS_ID: id }, transaction: t });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации об участке ЭЦД.
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
      creds: [MOD_ECDSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  modECDSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name } = req.body;

      // Ищем в БД участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDSector.findOne({ where: { ECDS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TECDSector.findOne({ where: { ECDS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.ECDS_ID !== candidate.ECDS_ID)) {
          return res.status(ERR).json({ message: 'Участок ЭЦД с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('name')) {
        updateFields.ECDS_Title = name;
      }

      await TECDSector.update(updateFields, {
        where: {
          ECDS_ID: id
        }
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
