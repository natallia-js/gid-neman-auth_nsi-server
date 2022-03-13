/**
 * Проверяет, утверждено ли заданное распоряжение.
 * Распоряжение считается утвержденным, если все получатели его оригинала подтвердили данное распоряжение.
 * При этом дата и время утверждения = самая поздняя из всех дат утверждения распоряжения оригиналами.
 * Получатели оригинала ищутся среди ДСП, ДНЦ, ЭЦД и Иных адресатов (т.е. всех тех, кто был упомянут в
 * секции "Кому" при издании распоряжения).
 * Функция возвращает дату и время утверждения распоряжения, если она уже есть (т.е. распоряжение уже
 * утверждено) либо ее можно определить. В противном случае функция возвращает null.
 */
function isOrderAsserted(order) {
  if (!order) {
    return null;
  }
  if (order.assertDateTime) {
    return order.assertDateTime;
  }
  let assertDateTime = null;
  let continueSearch = true;

  const searchAssertDateTimeAmongAddresses = (addresses) => {
    if (continueSearch && addresses && addresses.length) {
      for (let el of addresses) {
        if (!el.sendOriginal) {
          continue;
        }
        if (!el.confirmDateTime) {
          continueSearch = false;
          break;
        }
        if (!assertDateTime || assertDateTime < el.confirmDateTime) {
          assertDateTime = el.confirmDateTime;
        }
      }
    }
  };
  searchAssertDateTimeAmongAddresses(order.dncToSend);
  searchAssertDateTimeAmongAddresses(order.dspToSend);
  searchAssertDateTimeAmongAddresses(order.ecdToSend);
  searchAssertDateTimeAmongAddresses(order.otherToSend);

  if (continueSearch && assertDateTime) {
    return assertDateTime;
  }
  return null;
}


module.exports = isOrderAsserted;
