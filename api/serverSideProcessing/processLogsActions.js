const DY58UsersLog = require('../models/DY58UsersLog');
const ErrorsLog = require('../models/ErrorsLog');
const AdminsLog = require('../models/AdminsLog');


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
      action: addDY58UserActionInfo.name,
      error: 'Попытка сохранить информацию о действии пользователем ДУ-58',
      actionParams: params,
    });
  }
}

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
      action: addAdminActionInfo.name,
      error: 'Попытка сохранить информацию о действии администратора',
      actionParams: params,
    });
  }
}


module.exports = {
  addError,
  addDY58UserActionInfo,
  addAdminActionInfo,
};