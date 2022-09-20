/**
 * Проверяет массив на уникальность его элементов.
 * Возвращает true, если все элементы массива уникальны, false - в противном случае.
 */
function testUniqueArrayElements(A) {
  if (!A) return true;
  const n = A.length;
  for (let i = 0; i < n-1; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (A[i] === A[j]) return false;
    }
  }
  return true;
}

module.exports = testUniqueArrayElements;
