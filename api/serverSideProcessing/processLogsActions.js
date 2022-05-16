const DY58UsersLog = require('../models/DY58UsersLog');
const ErrorsLog = require('../models/ErrorsLog');
const AdminsLog = require('../models/AdminsLog');
const ServerLog = require('../models/ServerLog');

/**
 * Добавление записи в коллекцию ошибок.
 */
async function addError(params) {
  const {
    errorTime,
    action,
    error,
    actionParams,
  } = params;
  try {
    const err = new ErrorsLog({
      errorTime,
      action,
      error,
      actionParams,
    });
    await err.save();
  } catch (error) {
    // ничего не делаем, т.к. писать уже некуда; в дальнейшем можно писать в файловый лог
  }
}

/**
 * Добавление записи в коллекцию действий пользователей системы ДУ-58.
 */
async function addDY58UserActionInfo(params) {
  const {
    user,
    workPoligon,
    actionTime,
    action,
    actionParams,
  } = params;
  try {
    const actionInfo = new DY58UsersLog({
      user,
      workPoligon,
      actionTime,
      action,
      actionParams,
    });
    await actionInfo.save();
  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Сохранение информации о действии пользователя ДУ-58',
      error,
      actionParams: params,
    });
  }
}

/**
 * Добавление записи в коллекцию действий администраторов.
 */
async function addAdminActionInfo(params) {
  const {
    user,
    actionTime,
    action,
    actionParams,
  } = params;
  try {
    const actionInfo = new AdminsLog({
      user,
      actionTime,
      action,
      actionParams,
    });
    await actionInfo.save();
  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Сохранение информации о действии администратора',
      error,
      actionParams: params,
    });
  }
}

/**
 * Добавление записи в коллекцию серверных действий.
 */
async function addServerActionInfo(params) {
  const {
    actionTime,
    action,
    description,
  } = params;
  try {
    const actionInfo = new ServerLog({
      actionTime,
      action,
      description,
    });
    await actionInfo.save();
  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Сохранение информации о действии сервера',
      error,
      actionParams: params,
    });
  }
}

module.exports = {
  addError,
  addDY58UserActionInfo,
  addAdminActionInfo,
  addServerActionInfo,
};
