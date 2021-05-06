const {
  ERR,
  UNAUTHORIZED,
  UNAUTHORIZED_ERR_MESS,
  CREDENTIALS_ERR_MESS,
} = require('../constants');

// Определяет необходимый способ проверки полномочий:
// and - все указанные полномочия должны присутствовать у пользователя;
// or - у пользователя должно присутствовать хотя бы одно из указанных полномочий
const HOW_CHECK_CREDS = {
  AND: 'and',
  OR: 'or',
};


/**
 * Промежуточный обработчик проверки полномочий на выполнение определенного действия.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
const checkAuthority = (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Ожидаем, что если req.action не указан, то нет необходимости проверять полномочия пользователя.
  // Если же req.action указан, то это должен быть объект с описанием тех полномочий, наличие которых необходимо
  // проверить у пользователя. Поле which данного объекта - одно из значений HOW_CHECK_CREDS.
  // Поле appsCreds - массив полномочий пользователя во всех приложениях ГИД Неман (appAbbrev - краткое наименование
  // приложения, creds - массив аббресиатур полномочий в рамках данного приложения).
  // В процессе проверки не учитываем наименования приложений. Полагаем, что в рамках всех приложений нет
  // полномочий с одинаковыми наименованиями.

  if (!req.action) {
    return next();
  }

  if (!req.action.which || !req.action.creds || !req.action.creds.length) {
    return res.status(ERR).json({ message: CREDENTIALS_ERR_MESS });
  }

  if (!req.user || !req.user.credentials || !req.user.credentials.length) {
    return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }

  let userCanPerformAction = false;

  if (req.action.which === HOW_CHECK_CREDS.OR) {
    for (let credToCheck of req.action.creds) {
      for (let cred of req.user.credentials) {
        if (cred.creds.indexOf(credToCheck) >= 0) {
          userCanPerformAction = true;
          break;
        }
      }
      if (userCanPerformAction) {
        break;
      }
    }
  } else if (req.action.which === HOW_CHECK_CREDS.AND) {
    let credsToFindNumber = req.action.creds.length;

    for (let credToCheck of req.action.creds) {
      for (let cred of req.user.credentials) {
        if (cred.creds.indexOf(credToCheck) >= 0) {
          credsToFindNumber -= 1;
          break;
        }
      }
    }

    if (credsToFindNumber === 0) {
      userCanPerformAction = true;
    }
  } else {
    return res.status(ERR).json({ message: CREDENTIALS_ERR_MESS });
  }

  if (!userCanPerformAction) {
    return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }

  next();
}


module.exports = {
  HOW_CHECK_CREDS,
  checkAuthority,
};
