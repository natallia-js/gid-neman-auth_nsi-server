const {
  UNAUTHORIZED,
  USER_NOT_FOUND_ERR_MESS,
  NOT_ON_DUTY_ERR_MESS,
} = require('../constants');
const User = require('../models/User');
const { addError } = require('../serverSideProcessing/processLogsActions');


function getOnDutyStatusByDates(lastTakeDutyTime, lastPassDutyTime) {
  if (
    (lastTakeDutyTime && !(lastTakeDutyTime instanceof Date)) ||
    (lastPassDutyTime && !(lastPassDutyTime instanceof Date))
  ) {
    throw new Error('getOnDutyStatusByDates function cannot operate with non-Date objects');
  }
  if (!lastTakeDutyTime) {
    return false;
  }
  if (lastPassDutyTime && lastTakeDutyTime.getTime() <= lastPassDutyTime.getTime()) {
    return false;
  }
  return true;
}


/**
 * Промежуточный обработчик проверки того, находится ли лицо, запрашивающее действие, на смене (дежурстве).
 * В req.user должна быть информация, извлеченная из token (см. auth.middleware.js).
 * Данная информация используется для извлечения данных о рабочем полигоне, для которого необходимо
 * проверить факт нахождения пользователя на дежурстве.
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

  const userData = req.user;

  try {
    const workPoligon = userData.workPoligon;

    // Смотрим, содержится ли в токене пользователя информация о его рабочем полигоне
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(UNAUTHORIZED).json({ message: NOT_ON_DUTY_ERR_MESS });
    }

    // Анализируем время принятия и сдачи дежурства пользователя, содержащиеся в его токене
    if (!getOnDutyStatusByDates(
      userData.lastTakeDutyTime ? new Date(userData.lastTakeDutyTime) : null,
      userData.lastPassDutyTime ? new Date(userData.lastPassDutyTime) : null)
    ) {
      return res.status(UNAUTHORIZED).json({ message: NOT_ON_DUTY_ERR_MESS });
    }

    // После предыдущей проверки мы уверены в том, что значение userData.lastTakeDutyTime определено

    // Ищем указанного пользователя в БД
    const user = await User.findOne({ _id: userData.userId });
    if (!user) {
      return res.status(UNAUTHORIZED).json({ message: USER_NOT_FOUND_ERR_MESS });
    }

    // Сверяем данные, содержащиеся в токене, с данными, извлеченными из БД
    if (
      !user.lastTakePassDutyTimes ||
      !user.lastTakePassDutyTimes.length ||
      !user.lastTakePassDutyTimes.find((item) =>
        item.lastTakeDutyTime &&
        item.lastTakeDutyTime.getTime() === new Date(userData.lastTakeDutyTime).getTime() &&
        (
          (!userData.lastPassDutyTime && !item.lastPassDutyTime) ||
          (userData.lastPassDutyTime && item.lastPassDutyTime && new Date(userData.lastPassDutyTime).getTime() === item.lastPassDutyTime.getTime())
        ) &&
        item.workPoligon.type === workPoligon.type &&
        item.workPoligon.id === workPoligon.id &&
        (
          (!workPoligon.workPlaceId && !item.workPoligon.workPlaceId) ||
          (workPoligon.workPlaceId && item.workPoligon.workPlaceId === workPoligon.workPlaceId)
        ))
    ) {
      return res.status(UNAUTHORIZED).json({ message: NOT_ON_DUTY_ERR_MESS });
    }

    next();

  } catch (e) {
    addError({
      errorTime: new Date(),
      action: 'Промежуточный обработчик проверки факта нахождения на дежурстве',
      error,
      actionParams: {},
    });
    res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }
}


module.exports = {
  getOnDutyStatusByDates,
  isOnDuty,
}
