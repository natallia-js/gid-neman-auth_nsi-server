const WorkOrder = require('../models/WorkOrder');
const Order = require('../models/Order');
const DY58UsersLog = require('../models/DY58UsersLog');
const ErrorsLog = require('../models/ErrorsLog');
const AdminsLog = require('../models/AdminsLog');
const config = require('config');


/**
 * 1) Удаляем те цепочки распоряжений из КОЛЛЕКЦИИ РАБОЧИХ РАСПОРЯЖЕНИЙ, у которых последнее распоряжение
 * не является действующим и дата окончания его действия не попадает во временной промежуток,
 * в течение которого распоряжение считается находящимся в работе (заданное количество часов назад от
 * текущего времени).
 * Не удаляем распоряжения, которые были доставлены на рабочее место, но не подтверждены на нем,
 * если дата окончания действия последнего распоряжения в их цепочке больше либо равна указанной дате.
 * Случай, когда распоряжение не доставлено на рабочее место, но подтверждено на нем (кем-то) рассматривается
 * так, как если бы распоряжение было доставлено и подтверждено.
 * Возможные варианты (Д - доставлено, П - подтверждено):
 * Д   П    Действие
 * -   -    удаляем при общем удалении (полагаем, что если до сих пор никто распоряжение не прочел, то
 *                                      такого рабочего места реально не существует)
 * -   +    удаляем при общем удалении
 * +   -    не удаляем при общем удалении (удаляем отдельно: раз уж распоряжение было доставлено, то
 *                                         такое рабочее место есть)
 * +   +    удаляем при общем удалении
 *
 * 2) Удаляем те цепочки распоряжений, хранящихся в ОСНОВНОЙ КОЛЛЕКЦИИ РАСПОРЯЖЕНИЙ, у которых последнее
 * распоряжение не является действующим и дата окончания его действия меньше указанной даты.
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
  await WorkOrder.deleteMany(matchFilter);

  // 2)
  matchFilter = {
    "orderChain.chainEndDateTime": { $lt: new Date(todayTime - storeOrdersInDBInDays * daysToMillisecondsMultiplier) },
  };
  await Order.deleteMany(matchFilter);

  // 3)
  matchFilter = {
    actionTime: { $lt: new Date(todayTime - storeLogsInDBInDays * daysToMillisecondsMultiplier) },
  };
  await DY58UsersLog.deleteMany(matchFilter);
  await AdminsLog.deleteMany(matchFilter);
  matchFilter = {
    errorTime: { $lt: new Date(todayTime - storeLogsInDBInDays * daysToMillisecondsMultiplier) },
  };
  await ErrorsLog.deleteMany(matchFilter);
}


module.exports = processDelDBData;
