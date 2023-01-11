const SPECIAL_CHARACTERS = ['\\', '$', '^', '.', '|', '?', '*', '+', '{', '{', '[', ']', '(', ')'];
const ESCAPE_CHARACTER = '\\';

/**
 * В заданной строке regexString (полагается, что данная строка будет участвовать в регулярном выражении)
 * экранирует все специальные символы и возвращает измененную строку.
 */
function escapeSpecialCharactersInRegexString(regexString) {
  if (!regexString) return regexString;
  const chars = regexString.split('');
  const newChars = [];
  chars.forEach((char, index) => {
    if (SPECIAL_CHARACTERS.indexOf(char) >= 0)
      newChars[index] = ESCAPE_CHARACTER + char;
    else
      newChars[index] = char;
  });
  return newChars.join('');
}

module.exports = escapeSpecialCharactersInRegexString;
