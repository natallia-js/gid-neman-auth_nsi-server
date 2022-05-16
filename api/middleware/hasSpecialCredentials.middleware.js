const {
  UNAUTHORIZED,
  UNAUTHORIZED_ERR_MESS,
} = require('../constants');

/**
 * Промежуточный обработчик проверки того, закреплены ли за пользователем указанные
 * специальные полномочия.
 *
 * В req.body должна быть информация о специальных полномочиях, которые необходимо проверить:
 * массив specialCredentials. Если данного массива нет или он пуст, то полагается, что за
 * пользователем не закреплено никаких специальных полномочий. Исключение генерироваться не будет.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
module.exports = (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }
  // За пользователем закреплен общий список полномочий?
  if (!req.user || !req.user.credentials || !req.user.credentials.length) {
    return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }

  const appCredentialsToCheck = req.body.specialCredentials;

  // Если специальных полномочий нет, то идем дальше
  if (!appCredentialsToCheck || !appCredentialsToCheck.length) {
    next();
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
      return res.status(UNAUTHORIZED).json({ message: 'Пользователь не имеет указанного специального полномочия' });
    }
  }

  next();
}
