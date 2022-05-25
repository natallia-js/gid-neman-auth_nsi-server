const { Router } = require('express');
const LastOrdersParam = require('../models/LastOrdersParam');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const DY58_ACTIONS = require('../middleware/DY58_ACTIONS');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


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
 * 
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_LAST_ORDERS_PARAMS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    const matchFilter = {
      'workPoligon.id': workPoligon.id,
      'workPoligon.type': workPoligon.type,
    };
    try {
      const data = await LastOrdersParam.find(matchFilter);
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка параметров всех последних изданных распоряжений',
        error: error.message,
        actionParams: { workPoligon },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
