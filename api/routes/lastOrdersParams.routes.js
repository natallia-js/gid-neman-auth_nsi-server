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
 * Т.к. Оператор при ДСП и ДСП работают на одном рабочем полигоне "Станция" и ведут один журнал распоряжений,
 * то информация для этим категорий пользователей будет вестись единая и предоставляться им всем.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона извлекается из токена пользователя.
 * Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
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
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    try {
      const matchFilter = {
        workPoligon: { $exists: true },
        'workPoligon.id': workPoligon.id,
        'workPoligon.type': workPoligon.type,
      };
      const data = await LastOrdersParam.find(matchFilter);

      res.status(OK).json(data || []);
    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
