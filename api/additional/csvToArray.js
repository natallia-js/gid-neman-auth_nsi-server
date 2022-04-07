/**
 * The Function in this module returns an array of string values, or NULL if CSV string is not well formed.
 *
 * The problem:
 *
 * Given: "CSV String" Definition
 * For the purpose of this discussion, a "CSV string" consists of zero or more values,
 * where multiple values are separated by a comma. Each value may consist of:
 * - a double quoted string (may contain unescaped single quotes)
 * - a single quoted string (may contain unescaped double quotes)
 * - a non-quoted string (may NOT contain quotes, commas or backslashes)
 * - an empty value (an all whitespace value is considered empty)
 *
 * Rules/Notes:
 * - Quoted values may contain commas.
 * - Quoted values may contain escaped-anything, e.g. 'that\'s cool'.
 * - Values containing quotes, commas, or backslashes must be quoted.
 * - Values containing leading or trailing whitespace must be quoted.
 * - The backslash is removed from all: \' in single quoted values.
 * - The backslash is removed from all: \" in double quoted values.
 * - Non-quoted strings are trimmed of any leading and trailing spaces.
 * - The comma separator may have adjacent whitespace (which is ignored).
 *
 * Find:
 * A JavaScript function which converts a valid CSV string (as defined above) into an array of string values.
 *
 * Solution:
 * The regular expressions used by this solution are complex.
 * And (IMHO) all non-trivial regexes should be presented in free-spacing mode with lots of comments and indentation.
 * Unfortunately, JavaScript does not allow free-spacing mode.
 * Thus, the regular expressions implemented by this solution are first presented in native regex syntax
 * (expressed using Python's handy: r'''...''' raw-multi-line-string syntax).
 *
 * First here is a regular expression which validates that a CVS string meets the above requirements:
 *
 * Regex to validate a "CSV string":
 *
 * re_valid = r"""
 * # Validate a CSV string having single, double or un-quoted values.
 * ^                                   # Anchor to start of string.
 * \s*                                 # Allow whitespace before value.
 * (?:                                 # Group for value alternatives.
 *   '[^'\\]*(?:\\[\S\s][^'\\]*)*'     # Either Single quoted string,
 * | "[^"\\]*(?:\\[\S\s][^"\\]*)*"     # or Double quoted string,
 * | [^,'"\s\\]*(?:\s+[^,'"\s\\]+)*    # or Non-comma, non-quote stuff.
 * )                                   # End group of value alternatives.
 * \s*                                 # Allow whitespace after value.
 * (?:                                 # Zero or more additional values
 *   ,                                 # Values separated by a comma.
 *   \s*                               # Allow whitespace before value.
 *   (?:                               # Group for value alternatives.
 *     '[^'\\]*(?:\\[\S\s][^'\\]*)*'   # Either Single quoted string,
 *   | "[^"\\]*(?:\\[\S\s][^"\\]*)*"   # or Double quoted string,
 *   | [^,'"\s\\]*(?:\s+[^,'"\s\\]+)*  # or Non-comma, non-quote stuff.
 *   )                                 # End group of value alternatives.
 *   \s*                               # Allow whitespace after value.
 * )*                                  # Zero or more additional values
 * $                                   # Anchor to end of string.
 * """
 *
 * If a string matches the above regex, then that string is a valid CSV string
 * (according to the rules previously stated) and may be parsed using the following regex.
 * The following regex is then used to match one value from the CSV string.
 * It is applied repeatedly until no more matches are found (and all values have been parsed).
 *
 * Regex to parse one value from valid CSV string:
 *
 * re_value = r"""
 * # Match one value in valid CSV string.
 * (?!\s*$)                            # Don't match empty last value.
 * \s*                                 # Strip whitespace before value.
 * (?:                                 # Group for value alternatives.
 *   '([^'\\]*(?:\\[\S\s][^'\\]*)*)'   # Either $1: Single quoted string,
 * | "([^"\\]*(?:\\[\S\s][^"\\]*)*)"   # or $2: Double quoted string,
 * | ([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)  # or $3: Non-comma, non-quote stuff.
 * )                                   # End group of value alternatives.
 * \s*                                 # Strip whitespace after value.
 * (?:,|$)                             # Field ends on comma or EOS.
 * """
 *
 * Note that there is one special case value that this regex does not match - the very last value when
 * that value is empty. This special "empty last value" case is tested for and handled by the js function
 * which follows.
 */
function csvToArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^;'"\s\\]*(?:\s+[^;'"\s\\]+)*)\s*(?:;\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^;'"\s\\]*(?:\s+[^;'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^;'"\s\\]*(?:\s+[^;'"\s\\]+)*))\s*(?:;|$)/g;
  // Return NULL if input string is not a well formed CSV string
  if (!re_valid.test(text)) {
    return null;
  }
  // Initialize an array to receive values
  var a = [];
  // "Walk" the string using replace with callback
  text.replace(re_value,
    function(_, m1, m2, m3) {
        // Remove backslash from \' in single quoted values
        if (m1 !== undefined) {
          a.push(m1.replace(/\\'/g, "'"));
        }
        // Remove backslash from \" in double quoted values
        else if (m2 !== undefined) {
          a.push(m2.replace(/\\"/g, '"'));
        }
        else if (m3 !== undefined) {
          a.push(m3);
        }
        return '';
    });
  // Handle a special case of an empty last value
  if (/;\s*$/.test(text)) a.push('');
  return a;
};

module.exports = csvToArray;
