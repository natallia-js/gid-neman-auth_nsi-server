/**
 * Сравнивает содержимое двух строковых массивов.
 * Возвращает true, если оба массива не определены либо оба содержат одни и те же строки
 * (порядок строк не имеет значения).
 */
function compareStringArrays(arr1, arr2) {
  if (!arr1 && !arr2) {
    return true;
  }
  if (!arr1 || !arr2 || !(arr1 instanceof Array) || !(arr2 instanceof Array) || (arr1.length !== arr2.length)) {
    return false;
  }
  const tmpArr1 = [...arr1].sort();
  const tmpArr2 = [...arr2].sort();
  for (let i = 0; i < tmpArr1.length; i += 1) {
    if (tmpArr1[i] !== tmpArr2[i]) {
      return false;
    }
  }
  return true;
}

module.exports = compareStringArrays;
