const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addECDTrainSectorValidationRules,
  delECDTrainSectorValidationRules,
  modECDTrainSectorValidationRules,
} = require('../validators/ecdTrainSectors.validator');
const validate = require('../validators/validate');
const { TECDTrainSector } = require('../models/TECDTrainSector');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');

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
 * Обрабатывает запрос на получение списка всех поездных участков ЭЦД.
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
      const data = await TECDTrainSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование поездного участка ЭЦД (обязательно),
 * ecdSectorId - id участка ЭЦД (обязателен),
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
  addECDTrainSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { name, ecdSectorId } = req.body;

      // Ищем в БД поездной участок ЭЦД, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TECDTrainSector.findOne({ where: { ECDTS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Поездной участок ECD с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом поездном участке ЭЦД
      const sector = await TECDTrainSector.create({ ECDTS_Title: name, ECDTS_ECDSectorID: ecdSectorId });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление поездного участка ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id поездного участка (обязателен)
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
  delECDTrainSectorValidationRules(),
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

      // Ищем в БД поездной участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDTrainSector.findOne({ where: { ECDTS_ID: id } });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный поездной участок ЭЦД не существует в базе данных' });
      }

      // Перед удалением поездного участка ЭЦД, для всех станций и перегонов, привязанных к нему,
      // необходимо удалить ссылки на данный поездной участок
      await TStation.update(
        { St_ECDTrainSectorID: null },
        { where: { St_ECDTrainSectorID: id } },
        { transaction: t }
      );
      await TBlock.update(
        { Bl_ECDTrainSectorID: null },
        { where: { Bl_ECDTrainSectorID: id } },
        { transaction: t }
      );
      await TECDTrainSector.destroy({ where: { ECDTS_ID: id } }, { transaction: t });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      await t.rollback();
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о поездном участке ЭЦД.
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
  modECDTrainSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name } = req.body;

      // Ищем в БД поездной участок ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDTrainSector.findOne({ where: { ECDTS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный поездной участок ЭЦД не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД поездной участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TECDTrainSector.findOne({ where: { ECDTS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.ECDTS_ID !== candidate.ECDTS_ID)) {
          return res.status(ERR).json({ message: 'Поездной участок ЭЦД с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (name || (name === '')) {
        updateFields.ECDTS_Title = name;
      }

      await TECDTrainSector.update(updateFields, {
        where: {
          ECDTS_ID: id,
        }
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
