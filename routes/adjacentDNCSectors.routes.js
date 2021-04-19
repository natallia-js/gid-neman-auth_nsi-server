const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addAdjacentDNCSectorsValidationRules,
  delAdjacentDNCSectorValidationRules,
} = require('../validators/adjacentDNCSectors.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TAdjacentDNCSector } = require('../models/TAdjacentDNCSector');
const { TDNCSector} = require('../models/TDNCSector');

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
 * Обрабатывает запрос на получение списка всех смежных участков ДНЦ.
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
      const data = await TAdjacentDNCSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление смежных участков ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID - id участка ДНЦ (обязательно),
 * adjSectorIDs - массив id смежных участков ДНЦ (обязательно),
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
  addAdjacentDNCSectorsValidationRules,
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID, adjSectorIDs } = req.body;

      // Проверяем, существует ли участок ДНЦ с указанным идентификатором
      let candidate = await TDNCSector.findOne({ where: { DNCS_ID: sectorID } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ДНЦ не существует в базе' });
      }

      // То же самое делаем для каждого заданного смежного участка, формируя массив id тех
      // переданных смежных участков, для которых проверка завершилась успехом
      const adjSectorsArr = [];

      for (let id of adjSectorIDs) {
        candidate = await TDNCSector.findOne({ where: { DNCS_ID: id } });
        if (candidate) {
          adjSectorsArr.push(id);
        }
      }

      if (!adjSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) смежный(-ые) участок(-ки) ДНЦ не существует(-ют) в базе' });
      }

      const finalAdjSectIds = [];

      // Для каждого смежного участка ДНЦ ищем в БД одну из комбинаций
      // [sectorID, id] или [id, sectorID]
      for (let id of adjSectorsArr) {
        const antiCandidate = await TAdjacentDNCSector.findOne({
          where: {
            [Op.or]: [
              { ADNCS_DNCSectorID1: sectorID, ADNCS_DNCSectorID2: id },
              { ADNCS_DNCSectorID1: id, ADNCS_DNCSectorID2: sectorID },
            ]
          }
        });

        // Если находим, то установить смежность с данным участком не можем.
        // Если не находим, то помещаем id данного участка в специальный массив.
        if (!antiCandidate) {
          finalAdjSectIds.push(id);
        }
      }

      if (!finalAdjSectIds.length) {
        return res.status(ERR).json({ message: 'Все указанные участки уже объявлены как смежные' });
      }

      // Создаем в БД записи с идентификаторами смежных участков
      for (let id of finalAdjSectIds) {
        await TAdjacentDNCSector.create({
          ADNCS_DNCSectorID1: sectorID,
          ADNCS_DNCSectorID2: id
        });
      }

      res.status(OK).json({ message: 'Информация успешно сохранена', finalAdjSectIds });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление смежного участка.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID1 - id участка ДНЦ (обязательно),
 * sectorID2 - id смежного участка ДНЦ (обязательно),
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
  delAdjacentDNCSectorValidationRules,
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID1, sectorID2 } = req.body;

      // Удаляем в БД запись
      await TAdjacentDNCSector.destroy({
        where: {
          [Op.or]: [
            { ADNCS_DNCSectorID1: sectorID1, ADNCS_DNCSectorID2: sectorID2 },
            { ADNCS_DNCSectorID1: sectorID2, ADNCS_DNCSectorID2: sectorID1 },
          ]
        }
      });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


module.exports = router;
