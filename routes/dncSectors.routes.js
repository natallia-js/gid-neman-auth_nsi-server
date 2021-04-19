const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
} = require('../validators/dncSectors.validator');
const validate = require('../validators/validate');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TDNCSector } = require('../models/TDNCSector');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TAdjacentDNCSector } = require('../models/TAdjacentDNCSector');
const { TNearestDNCandECDSector } = require('../models/TNearestDNCandECDSector');
const { Op } = require('sequelize');

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
 * Обрабатывает запрос на получение списка всех участков ДНЦ.
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
      const data = await TDNCSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
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
  checkAuthority,
  // проверка параметров запроса
  addDNCSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { name } = req.body;

      // Ищем в БД участок ДНЦ, наименование которого совпадает с переданным пользователем
      let antiCandidate = await TDNCSector.findOne({ where: { DNCS_Title: name } });

      // Если находим, то процесс создания продолжать не можем
      if (antiCandidate) {
        return res.status(ERR).json({ message: 'Участок ДНЦ с таким наименованием уже существует' });
      }

      // Создаем в БД запись с данными о новом участке ДНЦ
      const sector = await TDNCSector.create({ DNCS_Title: name });

      res.status(OK).json({ message: 'Информация успешно сохранена', sector });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
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
  checkAuthority,
  // проверка параметров запроса
  delDNCSectorValidationRules,
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

      // Ищем в БД участок ДНЦ, id которого совпадает с переданным пользователем
      const candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе данных' });
      }

      // Перед удалением участка ДНЦ ищем все поездные участки ДНЦ: они будут удалены в процессе
      // удаления информации об участке ДНЦ, поэтому для станций и перегонов необходимо удалить ссылки
      // на данные поездные участки
      const dncTrainSectors = await TDNCTrainSector.findAll({ where: { DNCTS_DNCSectorID: id } });

      // Удаляем в БД запись и все связанные с нею записи (порядок имеет значение!)
      await TAdjacentDNCSector.destroy(
        {
          where: {
            [Op.or]: [
              { ADNCS_DNCSectorID1: id },
              { ADNCS_DNCSectorID2: id },
            ],
          },
        },
        { transaction: t }
      );
      await TNearestDNCandECDSector.destroy({ where: { NDE_DNCSectorID: id } }, { transaction: t });
      if (dncTrainSectors && dncTrainSectors.length) {
        await TStation.update(
          { St_DNCTrainSectorID: null },
          { where: { St_DNCTrainSectorID: dncTrainSectors.map(el => el.DNCTS_ID) } },
          { transaction: t }
        );
        await TBlock.update(
          { Bl_DNCTrainSectorID: null },
          { where: { Bl_DNCTrainSectorID: dncTrainSectors.map(el => el.DNCTS_ID) } },
          { transaction: t }
        );
      }
      await TDNCTrainSector.destroy({ where: { DNCTS_DNCSectorID: id } }, { transaction: t });
      await TDNCSector.destroy({ where: { DNCS_ID: id } }, { transaction: t });

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
  checkAuthority,
  // проверка параметров запроса
  modDNCSectorValidationRules,
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, name } = req.body;

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

      if (name || (name === '')) {
        updateFields.DNCS_Title = name;
      }

      await TDNCSector.update(updateFields, {
        where: {
          DNCS_ID: id
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
