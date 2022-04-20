const { Router } = require('express');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
} = require('../constants');


/**
 * Обрабатывает запрос на получение данных от АС "Окна".
 *
 * Данный запрос доступен любому лицу.
 */
 router.get(
  '/data',
  async (_req, res) => {
    let getOKNARequest = '';
    try {
      const fetch = require('node-fetch');
      const config = require('config');
      const checkStatus = require('../http/checkStatus');
      getOKNARequest = config.get('OKNA.getDataRequest');

      // Пытаюсь получить данные от АС "ОКНА"
      const response = await fetch(getOKNARequest, { method: 'GET', body: null, headers: {} });
      checkStatus(response);
      const data = await response.json();

      res.status(OK).json({ data });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации от АС Окна',
        error,
        actionParams: { getOKNARequest },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
