const compareStrings = (a, b) => {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;

  // return a.localeCompare(b);
};

export default compareStrings;
