const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { addError } = require('../serverSideProcessing/processLogsActions');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');

const DY58_MANUALS_FOLDER = path.join(__dirname, '..', '/upload/dy58');

/**
 * Обрабатывает запрос на получение списка файлов руководств ДУ-58, доступных к загрузке.
 *
 * Данный запрос доступен любому лицу.
 */
router.get(
  '/dy58UserManualsList',
  async (_req, res) => {
    try {
      const fileNamesList = fs.readdirSync(DY58_MANUALS_FOLDER);      
      res.status(OK).json({ fileNamesList });
  
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка файлов руководств ДУ-58',
        error: error.message,
        actionParams: null,
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на загрузку файла руководства по ДУ-58.
 *
 * Данный запрос доступен любому лицу.
 *
 * Параметры запроса:
 * fileName - имя документа (одно из значений, возвращаемых запросом dy58UserManualsList)
 */
 router.get(
  '/downloadDY58Manual/:fileName',
  async (req, res) => {
    const fileName = req.params.fileName;

    // download function sets the content disposition header and sends the file
    res.download(path.join(DY58_MANUALS_FOLDER, fileName), fileName, (error) => {
      if (error) {
        addError({
          errorTime: new Date(),
          action: 'Загрузка файла руководства ДУ-58',
          error,
          actionParams: { fileName },
        });
        // Check if headers have been sent
        if (!res.headersSent) {
          return res.sendStatus(UNKNOWN_ERR);
        }
      }
      // Don't need res.end() here since already sent
    });
  }
);

module.exports = router;
