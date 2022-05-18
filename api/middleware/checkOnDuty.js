const {
  UNAUTHORIZED, 
  UNAUTHORIZED_ERR_MESS,
  USER_NOT_FOUND_ERR_MESS,
  NOT_ON_DUTY_ERR_MESS,
} = require('../constants');
const User = require('../models/User');
const { addError } = require('../serverSideProcessing/processLogsActions');
const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');
const DY58_ACTIONS = require('./DY58_ACTIONS');

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
 * Проверка факта нахождения лица, запрашивающего действие, на смене (дежурстве).
 * В req.user должна быть информация, извлеченная из токена пользователя, хранящегося в пользовательской сессии.
 * Данная информация используется для извлечения данных о рабочем полигоне, для которого необходимо
 * проверить факт нахождения пользователя на дежурстве.
 */
async function isOnDuty(req) {
  try {
    const userData = req.user;
    const workPoligon = userData.workPoligon;

    // Смотрим, содержится ли в токене пользователя информация о его рабочем полигоне
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return { err: true, status: UNAUTHORIZED, message: NOT_ON_DUTY_ERR_MESS };
    }

    // Анализируем время принятия и сдачи дежурства пользователя, содержащиеся в его токене
    if (!getOnDutyStatusByDates(
        userData.lastTakeDutyTime ? new Date(userData.lastTakeDutyTime) : null,
        userData.lastPassDutyTime ? new Date(userData.lastPassDutyTime) : null)
    ) {
      return { err: true, status: UNAUTHORIZED, message: NOT_ON_DUTY_ERR_MESS };
    }

    // После предыдущей проверки мы уверены в том, что значение userData.lastTakeDutyTime определено

    // Ищем указанного пользователя в БД
    const user = await User.findOne({ _id: userData.userId, confirmed: true });
    if (!user) {
      return { err: true, status: UNAUTHORIZED, message: USER_NOT_FOUND_ERR_MESS };
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
      return { err: true, status: UNAUTHORIZED, message: NOT_ON_DUTY_ERR_MESS };
    }

    return { err: false };

  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Промежуточный обработчик проверки нахождения пользователя на дежурстве',
      error: error.message,
      actionParams: { request: req },
    });
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }
};
  
/**
 * Для ряда запросов проверяет факт нахождения пользователя на дежурстве.
 */
async function checkOnDuty(req) {
  if (req && [
    // Пользователь
    AUTH_NSI_ACTIONS.LOGOUT_WITH_DUTY_PASS,
    
    // Черновики распоряжений
    DY58_ACTIONS.ADD_ORDER_DRAFT,
    DY58_ACTIONS.DEL_ORDER_DRAFT,
    DY58_ACTIONS.MOD_ORDER_DRAFT,
    
    // Распоряжения
    DY58_ACTIONS.ADD_ORDER,
    DY58_ACTIONS.MOD_ORDER,
    DY58_ACTIONS.CONFIRM_ORDER,
    DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHER_RECEIVERS,
    DY58_ACTIONS.CONFIRM_ORDER_FOR_OTHERS,
    DY58_ACTIONS.DEL_CONFIRMED_ORDERS_FROM_CHAIN,
    DY58_ACTIONS.DEL_STATION_WORK_PLACE_RECEIVER,
    ].includes(req.requestedAction)
  ) {
    return await isOnDuty(req);
  }
  return { err: false };
}

module.exports = checkOnDuty;
