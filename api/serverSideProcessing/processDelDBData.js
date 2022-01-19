const WorkOrder = require('../models/WorkOrder');
const Order = require('../models/Order');
const config = require('config');


/**
 * 1) Удаляем те цепочки распоряжений из КОЛЛЕКЦИИ РАБОЧИХ РАСПОРЯЖЕНИЙ, у которых последнее распоряжение
 * не является действующим и дата окончания его действия не попадает во временной промежуток,
 * в течение которого распоряжение считается находящимся в работе (заданное количество часов назад от
 * текущего времени).
 * Ни в коем случае не удаляем распоряжения, которые не были подтверждены на рабочем месте, вне зависимости
 * от того, были ли они доставлены на данное рабочее место, если дата окончания действия последнего
 * распоряжения в их цепочке больше либо равна указанной дате.
 * Случай, когда распоряжение не доставлено на рабочее место, но подтверждено на нем (кем-то) рассматривается
 * так, как если бы распоряжение было доставлено и подтверждено.
 * Возможные варианты (Д - доставлено, П - подтверждено):
 * Д   П    Действие
 * -   -    не удаляем при общем удалении (удаляем отдельно)
 * -   +    удаляем при общем удалении
 * +   -    не удаляем при общем удалении (удаляем отдельно)
 * +   +    удаляем при общем удалении
 *
 * 2) Удаляем те цепочки распоряжений, хранящихся в ОСНОВНОЙ КОЛЛЕКЦИИ РАСПОРЯЖЕНИЙ, у которых последнее
 * распоряжение не является действующим и дата окончания его действия меньше указанной даты.
 *
 * !!! Для корректной работы с программой необходимо, чтобы максимальное время хранения распоряжений в
 * коллекции рабочих распоряжений было меньше времени хранения распоряжений в основной коллекции распоряжений.
 */
async function processDelDBData() {
  const today = new Date();
  const workPeriodInDays = config.has('workPeriodInDays') ? config.get('workPeriodInDays') : 1;
  const storeOrdersInDBInDays = config.has('storeOrdersInDBInDays') ? config.get('storeOrdersInDBInDays') : 365;
  const maxDaysToStoreUnconfirmedOrders = config.has('maxDaysToStoreUnconfirmedOrders')
    ? config.get('maxDaysToStoreUnconfirmedOrders') : 100;
  const daysToMillisecondsMultiplier = 24 * 60 * 60 * 1000;

  // 1)
  let matchFilter = {
    $or: [
      {
        $and: [
          // { field: null } means that field is null or does not exist
          { confirmDateTime: null },
          { orderChain: { $exists: true } },
          { "orderChain.chainEndDateTime": { $exists: true } },
          { "orderChain.chainEndDateTime": { $ne: null } },
          { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - maxDaysToStoreUnconfirmedOrders * daysToMillisecondsMultiplier) } },
        ],
      },
      {
        $and: [
          // $ne selects the documents where the value of the field is not equal to the specified value.
          // This includes documents that do not contain the field.
          { confirmDateTime: { $ne: null } },
          { orderChain: { $exists: true } },
          { "orderChain.chainEndDateTime": { $exists: true } },
          { "orderChain.chainEndDateTime": { $ne: null } },
          { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - workPeriodInDays * daysToMillisecondsMultiplier) } },
        ],
      },
    ],
  };
  await WorkOrder.deleteMany(matchFilter);

  // 2)
  matchFilter = {
    $and: [
      { orderChain: { $exists: true } },
      { "orderChain.chainEndDateTime": { $exists: true } },
      { "orderChain.chainEndDateTime": { $ne: null } },
      { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - storeOrdersInDBInDays * daysToMillisecondsMultiplier) } },
    ],
  };
  await Order.deleteMany(matchFilter);
}


module.exports = processDelDBData;
