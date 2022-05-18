const { Router } = require('express');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const DY58_ACTIONS = require('../middleware/DY58_ACTIONS');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение данных от АС "Окна".
 * Параметр stationsCodes - массив с кодами станций, информацию по которым необходимо получить.
 * Возвращает информацию по перегонам, обе станции которых входят в массив stationsCodes.
 *
 * Данный запрос доступен любому лицу.
 */
 router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_OKNAS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const { stationsCodes } = req.body;

    let getOKNARequest = '';
    try {
      const fetch = require('node-fetch');
      const config = require('config');
      const checkStatus = require('../http/checkStatus');
      const { DEFAULT_ENCODING, getResponseEncoding } = require('../http/getResponseEncoding');
      getOKNARequest = config.get('OKNA.getDataRequest');

      // Пытаюсь получить данные от АС "ОКНА"
      const response = await fetch(getOKNARequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);
      // Этот кусок кода нужен обязательно, т.к. данные передаются в utf-8, а сообщения об ошибках - почему-то в
      // другой кодировке
      const responseEncoding = getResponseEncoding(response);

      let data;
      if (responseEncoding === DEFAULT_ENCODING) {
        data = await response.json();
        if (data instanceof Array) {
          // Выбираю нужные данные (по кодам станций)
          data = data.filter((el) => stationsCodes.includes(el.sta1) && stationsCodes.includes(el.sta2));
        }
      } else {
        // Декодирую полученные данные
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder(responseEncoding);
        data = JSON.parse(decoder.decode(buffer));
      }
      res.status(OK).json({ data });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации от АС Окна',
        error: error.message,
        actionParams: { getOKNARequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
