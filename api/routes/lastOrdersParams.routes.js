const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const LastOrdersParam = require('../models/LastOrdersParam');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  DNC_FULL,
  DSP_FULL,
  DSP_Operator,
  ECD_FULL,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка параметров всех последних изданных распоряжений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса (workPoligonType, workPoligonId, workPoligonWorkPlaceId), если указаны,
 * то определяют рабочий полигон, информацию по которому необходимо извлечь.
 * Если рабочий полигон не указан, то будет извлечена информация, имеющая отношение ко всем
 * рабочим полигонам.
 */
router.post(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId, workPoligonWorkPlaceId } = req.body;

      const matchFilter = {
        workPoligon: { $exists: true },
        'workPoligon.id': workPoligonId,
        'workPoligon.type': workPoligonType,
      };
      if (workPoligonWorkPlaceId) {
        matchFilter['workPoligon.workPlaceId'] = workPoligonWorkPlaceId;
      } else {
        matchFilter.$or = [
          { 'workPoligon.workPlaceId': { $exists: false } },
          { 'workPoligon.workPlaceId': null },
        ];
      }
      const data = await LastOrdersParam.find(matchFilter);

      res.status(OK).json(data || []);
    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
