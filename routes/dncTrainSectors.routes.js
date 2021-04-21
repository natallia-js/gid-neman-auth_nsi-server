const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addDNCTrainSectorValidationRules,
  delDNCTrainSectorValidationRules,
  modDNCTrainSectorValidationRules,
} = require('../validators/dncTrainSectors.validator');
const validate = require('../validators/validate');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_DNCSECTORS_ACTION,
  MOD_DNCSECTOR_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех поездных участков ДНЦ.
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
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await TDNCTrainSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового поездного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * name - наименование поездного участка ДНЦ (обязательно),
 * dncSectorId - id участка ДНЦ (обязателен),
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
  checkAuthority,
  // проверка параметров запроса
  addDNCTrainSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { name, dncSectorId } = req.body;

      // Ищем в БД поездной участок ДНЦ, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TDNCTrainSector.findOne({ where: { DNCTS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Поездной участок ДНЦ с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом поездном участке ДНЦ
      const sector = await TDNCTrainSector.create({ DNCTS_Title: name, DNCTS_DNCSectorID: dncSectorId });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление поездного участка ДНЦ.
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
      creds: [MOD_DNCSECTOR_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  delDNCTrainSectorValidationRules(),
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

      // Ищем в БД поездной участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCTrainSector.findOne({ where: { DNCTS_ID: id } });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный поездной участок ДНЦ не существует в базе данных' });
      }

      // Перед удалением поездного участка ДНЦ, для всех станций и перегонов, привязанных к нему,
      // необходимо удалить ссылки на данный поездной участок
      await TStation.update(
        { St_DNCTrainSectorID: null },
        { where: { St_DNCTrainSectorID: id } },
        { transaction: t }
      );
      await TBlock.update(
        { Bl_DNCTrainSectorID: null },
        { where: { Bl_DNCTrainSectorID: id } },
        { transaction: t }
      );
      await TDNCTrainSector.destroy({ where: { DNCTS_ID: id } }, { transaction: t });

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
 * Обработка запроса на редактирование информации о поездном участке ДНЦ.
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
  checkAuthority,
  // проверка параметров запроса
  modDNCTrainSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name } = req.body;

      // Ищем в БД поездной участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCTrainSector.findOne({ where: { DNCTS_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный поездной участок ДНЦ не существует в базе данных' });
      }

      // Если необходимо отредактировать наименование участка, то ищем в БД поездной участок, наименование
      // которого совпадает с переданным пользователем
      if (name || (name === '')) {
        const antiCandidate = await TDNCTrainSector.findOne({ where: { DNCTS_Title: name } });

        // Если находим, то смотрим, тот ли это самый участок. Если нет, продолжать не можем.
        if (antiCandidate && (antiCandidate.DNCTS_ID !== candidate.DNCTS_ID)) {
          return res.status(ERR).json({ message: 'Поездной участок ДНЦ с таким наименованием уже существует' });
        }
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (name || (name === '')) {
        updateFields.DNCTS_Title = name;
      }

      await TDNCTrainSector.update(updateFields, {
        where: {
          DNCTS_ID: id,
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
