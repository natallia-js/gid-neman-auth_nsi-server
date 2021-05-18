const {
  MAIN_ADMIN_ROLE_NAME,
  UNAUTHORIZED,
  UNAUTHORIZED_ERR_MESS,
} = require('../constants');


const isMainAdmin = (req) => {
  return req.user && req.user.roles && req.user.roles.includes(MAIN_ADMIN_ROLE_NAME);
};


/**
 * Промежуточный обработчик проверки того, является ли лицо, запрашивающее действие, главным администратором ГИД Неман.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
const checkMainAdmin = (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (!isMainAdmin(req)) {
    return res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }

  next();
}


module.exports = {
  isMainAdmin,
  checkMainAdmin,
};
