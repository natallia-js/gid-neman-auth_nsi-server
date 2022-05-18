const { UNAUTHORIZED, UNAUTHORIZED_ERR_MESS } = require('../constants');
const { addError } = require('../serverSideProcessing/processLogsActions');
const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');

/**
 * Проверяет, закреплены ли за пользователем указанные специальные полномочия.
 *
 * В req.body должна быть информация о специальных полномочиях, которые необходимо проверить:
 * массив specialCredentials. Если данного массива нет или он пуст, то полагается, что за
 * пользователем не закреплено никаких специальных полномочий. Исключение генерироваться не будет.
 */
module.exports = (req) => {
  if (!req || ![
    AUTH_NSI_ACTIONS.START_WORK_WITHOUT_TAKING_DUTY,
    AUTH_NSI_ACTIONS.START_WORK_WITH_TAKING_DUTY,
    ].includes(req.requestedAction)
  ) {
    return { err: false };
  }

  // За пользователем закреплен ОБЩИЙ список полномочий?
  if (!req.user || !req.user.credentials || !req.user.credentials.length) {
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }

  try {
    const appCredentialsToCheck = req.body.specialCredentials;

    // Если специальных полномочий нет, то все ОК
    if (!appCredentialsToCheck || !appCredentialsToCheck.length) {
      return { err: false };
    }

    for (let specCred of appCredentialsToCheck) {
      let foundCred = false;
      for (let appCreds of req.user.credentials) {
        if (!appCreds || !appCreds.creds || !appCreds.creds.length) {
          continue;
        }
        foundCred = appCreds.creds.includes(specCred);
        if (foundCred) {
          break;
        }
      }
      if (!foundCred) {
        return { err: true, status: UNAUTHORIZED, message: 'Пользователь не имеет указанного специального полномочия' };
      }
    }

    return { err: false };

  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Проверка закрепленности за пользователем специальных полномочий',
      error: error.message,
      actionParams: {
        requestBody: req.body,
        requestUser: req.user,
      },
    });
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }
};
