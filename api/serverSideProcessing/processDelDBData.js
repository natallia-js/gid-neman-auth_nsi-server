const WorkOrder = require('../models/WorkOrder');
const Order = require('../models/Order');
const DY58UsersLog = require('../models/DY58UsersLog');
const ErrorsLog = require('../models/ErrorsLog');
const AdminsLog = require('../models/AdminsLog');
const ServerLog = require('../models/ServerLog');
const { addServerActionInfo } = require('./processLogsActions');
const config = require('config');


/**
 * 1) Удаляем те цепочки распоряжений из КОЛЛЕКЦИИ РАБОЧИХ РАСПОРЯЖЕНИЙ, у которых присутствует дата
 * окончания действия (цепочки), причем эта дата окончания действия меньше левой границы временного промежутка,
 * в течение которого распоряжение считается находящимся в работе (заданное количество часов назад от
 * текущего времени - так называемый "рабочий период").
 *
 * Не удаляем распоряжения, которые были доставлены на рабочее место, но не подтверждены на нем,
 * если дата окончания действия цепочки распоряжений больше либо равна указанной дате (т.е. определяем время,
 * в течение которого такие распоряжения могут еще "полежать" как рабочие). В противном случае они подлежат удалению.
 *
 * Случай, когда распоряжение не доставлено на рабочее место, но подтверждено на нем (кем-то) рассматривается
 * так, как если бы распоряжение было доставлено и подтверждено.
 * Возможные варианты (Д - доставлено, П - подтверждено):
 * Д   П    Действие
 * -   -    удаляем при общем удалении (полагаем, что если до сих пор никто распоряжение не прочел, то
 *                                      такого рабочего места реально не существует)
 * -   +    удаляем при общем удалении
 * +   -    не удаляем при общем удалении (удаляем отдельно: раз уж распоряжение было доставлено, то
 *                                         такое рабочее место есть, просто пока документ никто не подтвердил)
 * +   +    удаляем при общем удалении
 *
 * 2) Удаляем распоряжения, хранящихся в ОСНОВНОЙ КОЛЛЕКЦИИ РАСПОРЯЖЕНИЙ, у которых дата ИЗДАНИЯ
 * меньше указанной даты (т.е. не смотрим, действует распоряжение или нет).
 *
 * !!! Для корректной работы с программой необходимо, чтобы максимальное время хранения распоряжений в
 * коллекции рабочих распоряжений было меньше времени хранения распоряжений в основной коллекции распоряжений.
 *
 * 3) Удаляются также записи из коллекций логов.
 */
async function processDelDBData() {
  const todayTime = new Date().getTime();
  const workPeriodInHours = config.has('workPeriodInHours') ? config.get('workPeriodInHours') : 1;
  const storeOrdersInDBInDays = config.has('storeOrdersInDBInDays') ? config.get('storeOrdersInDBInDays') : 365;
  const maxDaysToStoreUnconfirmedOrders = config.has('maxDaysToStoreUnconfirmedOrders')
    ? config.get('maxDaysToStoreUnconfirmedOrders') : 100;
  const storeLogsInDBInDays = config.has('storeLogsInDBInDays') ? config.get('storeLogsInDBInDays') : 365;
  const daysToMillisecondsMultiplier = 24 * 60 * 60 * 1000;
  const hoursToMillisecondsMultiplier = 60 * 60 * 1000;

  // 1)
  let matchFilter = {
    $or: [
      {
        $and: [
          // { field: null } means that field is null or does not exist
          { deliverDateTime: { $ne: null } },
          { confirmDateTime: null },
          { "orderChain.chainEndDateTime": { $lt: new Date(todayTime - maxDaysToStoreUnconfirmedOrders * daysToMillisecondsMultiplier) } },
        ],
      },
      {
        $and: [
          // $ne selects the documents where the value of the field is not equal to the specified value.
          // This includes documents that do not contain the field.
          { $or: [
            { confirmDateTime: { $ne: null } },
            { $and: [ { deliverDateTime: null }, { confirmDateTime: null } ] },
          ]},
          { "orderChain.chainEndDateTime": { $lt: new Date(todayTime - workPeriodInHours * hoursToMillisecondsMultiplier) } },
        ],
      },
    ],
  };
  let delRes = await WorkOrder.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы рабочих распоряжений',
    description: `удалено записей ${delRes.deletedCount}`,
  });

  // 2)
  matchFilter = {
    createDateTime: { $lt: new Date(todayTime - storeOrdersInDBInDays * daysToMillisecondsMultiplier) },
  };
  delRes = await Order.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы распоряжений',
    description: `удалено записей ${delRes.deletedCount}`,
  });

  // 3)
  matchFilter = {
    actionTime: { $lt: new Date(todayTime - storeLogsInDBInDays * daysToMillisecondsMultiplier) },
  };
  delRes = await DY58UsersLog.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы логов действий пользователей ДУ-58',
    description: `удалено записей ${delRes.deletedCount}`,
  });
  delRes = await AdminsLog.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы логов администраторов',
    description: `удалено записей ${delRes.deletedCount}`,
  });
  delRes = await ServerLog.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы логов действий сервера',
    description: `удалено записей ${delRes.deletedCount}`,
  });
  matchFilter = {
    errorTime: { $lt: new Date(todayTime - storeLogsInDBInDays * daysToMillisecondsMultiplier) },
  };
  delRes = await ErrorsLog.deleteMany(matchFilter);
  addServerActionInfo({
    actionTime: new Date(),
    action: '"чистка" таблицы логов серверных ошибок',
    description: `удалено записей ${delRes.deletedCount}`,
  });
}


module.exports = processDelDBData;
