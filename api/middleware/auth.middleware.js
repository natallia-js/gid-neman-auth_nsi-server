const jwt = require('jsonwebtoken');
const config = require('config');
const {
  UNAUTHORIZED,
  UNAUTHORIZED_ERR_MESS,
} = require('../constants');

const { CONFIG_JWT_SECRET_PARAM_NAME } = require('../constants');
const jwtSecret = config.get(CONFIG_JWT_SECRET_PARAM_NAME);


/**
 * Промежуточный обработчик аутентификации.
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

  try {
    // Считываем из заголовка http-запроса авторизации (Authorization) данные пользователя
    // для проверки подлинности пользовательского агента на сервере.
    // Заготовок выглядит так: "Authorization: <тип> <данные пользователя>".
    // В нашем слуачае это: "Authorization: Bearer TOKEN", где TOKEN - это именно то, что
    // нам нужно.
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
    }
    // Function 'verify()' acts synchronously if a callback is not supplied.
    // Returns the payload (полезные данные: например, id пользователя, его роль и т.д.)
    // decoded if the signature is valid. If not, it will throw an error.
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    /**
     * EXAMPLE:
     * decoded = {
[0]   userId: '60d9beefe2f14904f0a315b4',
[0]   service: 'Д',
[0]   roles: [ 'DNC', 'ECD', 'DSP', 'DSP_Operator' ],
[0]   credentials: [
[0]     { appAbbrev: 'DY-58', creds: [Array] },
[0]     { appAbbrev: 'GidNemanAuthNSIUtil', creds: [Array] }
[0]   ],
[0]   stationWorkPoligons: [
[0]     { SWP_StID: 22, SWP_StWP_ID: null },
[0]     { SWP_StID: 54, SWP_StWP_ID: 8 }
[0]   ],
[0]   dncSectorsWorkPoligons: [ { DNCSWP_DNCSID: 2 } ],
[0]   ecdSectorsWorkPoligons: [],
[0]   iat: 1641650120,
[0]   lastTakeDutyTime: '2022-01-08T13:55:22.665Z',
[0]   lastPassDutyTime: null,
[0]   workPoligon: { type: 'участок ДНЦ', id: 2, workPlaceId: null }
[0] }
     */

    // Переходим к следующему обработчику
    next();

  } catch (e) {
    console.log(e)
    res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }
}
