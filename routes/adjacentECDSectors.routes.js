const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const {
  addAdjacentECDSectorsValidationRules,
  delAdjacentECDSectorValidationRules,
} = require('../validators/adjacentECDSectors.validator');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { TAdjacentECDSector } = require('../models/TAdjacentECDSector');
const { TECDSector} = require('../models/TECDSector');

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
 * Обрабатывает запрос на получение списка всех смежных участков ЭЦД.
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
      const data = await TAdjacentECDSector.findAll({ raw: true });
      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление смежных участков ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * sectorID - id участка ЭЦД (обязательно),
 * adjSectorIDs - массив id смежных участков ЭЦД (обязательно),
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
  addAdjacentECDSectorsValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID, adjSectorIDs } = req.body;

      // Проверяем, существует ли участок ЭЦД с указанным идентификатором
      let candidate = await TECDSector.findOne({ where: { ECDS_ID: sectorID } });
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный участок ЭЦД не существует в базе' });
      }

      // То же самое делаем для каждого заданного смежного участка, формируя массив id тех
      // переданных смежных участков, для которых проверка завершилась успехом
      const adjSectorsArr = [];

      for (let id of adjSectorIDs) {
        candidate = await TECDSector.findOne({ where: { ECDS_ID: id } });
        if (candidate) {
          adjSectorsArr.push(id);
        }
      }

      if (!adjSectorsArr.length) {
        return res.status(ERR).json({ message: 'Указанный(-ые) смежный(-ые) участок(-ки) ЭЦД не существует(-ют) в базе' });
      }

      const finalAdjSectIds = [];

      // Для каждого смежного участка ЭЦД ищем в БД одну из комбинаций
      // [sectorID, id] или [id, sectorID]
      for (let id of adjSectorsArr) {
        const antiCandidate = await TAdjacentECDSector.findOne({
          where: {
            [Op.or]: [
              { AECDS_ECDSectorID1: sectorID, AECDS_ECDSectorID2: id },
              { AECDS_ECDSectorID1: id, AECDS_ECDSectorID2: sectorID },
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
        await TAdjacentECDSector.create({
          AECDS_ECDSectorID1: sectorID,
          AECDS_ECDSectorID2: id
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
 * sectorID1 - id участка ЭЦД (обязательно),
 * sectorID2 - id смежного участка ЭЦД (обязательно),
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
  delAdjacentECDSectorValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Проводим проверку корректности переданных пользователем данных
      const errors = validationResult(req);

      // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках
      if (!errors.isEmpty()) {
        return res.status(ERR).json({
          errors: errors.array(),
          message: 'Указаны некорректные данные при удалении смежного участка ЭЦД'
        });
      }
    } catch (e) {
      console.log(e);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${e.message}` });
      return;
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { sectorID1, sectorID2 } = req.body;

      // Удаляем в БД запись
      await TAdjacentECDSector.destroy({
        where: {
          [Op.or]: [
            { AECDS_ECDSectorID1: sectorID1, AECDS_ECDSectorID2: sectorID2 },
            { AECDS_ECDSectorID1: sectorID2, AECDS_ECDSectorID2: sectorID1 },
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
