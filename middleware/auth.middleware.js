const jwt = require('jsonwebtoken');
const config = require('config');

const CONFIG_JWT_SECRET_PARAM_NAME = 'jwtSecret';


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
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    // Function 'verify()' acts synchronously if a callback is not supplied.
    // Returns the payload (полезные данные: например, id пользователя, его роль и т.д.)
    // decoded if the signature is valid. If not, it will throw an error.
    const decoded = jwt.verify(token, config.get(CONFIG_JWT_SECRET_PARAM_NAME));
    req.user = decoded;

    // Переходим к следующему обработчику
    next();

  } catch (e) {
    res.status(401).json({ message: 'Пользователь не авторизован' });
  }
}
