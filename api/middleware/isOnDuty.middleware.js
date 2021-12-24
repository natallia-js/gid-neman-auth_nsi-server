const {
  UNAUTHORIZED,
  USER_NOT_FOUND_ERR_MESS,
  NOT_ON_DUTY_ERR_MESS,
} = require('../constants');
const User = require('../models/User');


/**
 * Промежуточный обработчик проверки того, находится ли лицо, запрашивающее действие, на смене.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
const isOnDuty = async (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  const candidate = await User.findOne({ _id: req.user.userId });

  if (!candidate) {
    return res.status(UNAUTHORIZED).json({ message: USER_NOT_FOUND_ERR_MESS });
  }

  if (!candidate.lastTakeDutyTime) {
    return res.status(UNAUTHORIZED).json({ message: NOT_ON_DUTY_ERR_MESS });
  }

  if (!candidate.lastPassDutyTime) {
    return next();
  }

  if (candidate.lastTakeDutyTime <= candidate.lastPassDutyTime) {
    return res.status(UNAUTHORIZED).json({ message: NOT_ON_DUTY_ERR_MESS });
  }

  next();
}


module.exports = {
  isOnDuty,
};
