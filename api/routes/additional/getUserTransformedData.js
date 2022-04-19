// Возвращает строку, в которой полностью указана фамилия человека, а его имя и отчество
// представлены лишь в виде первых букв, за которыми следует точка
const getUserConciseFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name.charAt(0)}.${fatherName && fatherName.length ? fatherName.charAt(0) + '.': ''}`;
};

// Возвращает строку, в которой полностью указаны фамилия, имя и отчество человека
const getUserFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name}${fatherName ? ' ' + fatherName : ''}`;
};

// Возвращает строку, в которой полностью указаны должность, фамилия, имя и отчество человека
const getUserPostFIOString = ({ post, name, fatherName, surname }) => {
  return `${post} ${getUserFIOString({ name, fatherName, surname })}`;
};

// Возвращает строку, в которой указаны должность, фамилия и (кратко) имя и отчество человека
const getUserConcisePostFIOString = ({ post, name, fatherName, surname }) => {
  return `${post} ${getUserConciseFIOString({ name, fatherName, surname })}`;
};

// На основании данных о человеке, содержащихся в переданном объекте, формируем и возвращает строку,
// в которой полностью указаны должность, фамилия, имя и отчество человека
const userPostFIOString = (userObject) =>
  getUserPostFIOString({
    post: userObject.post,
    name: userObject.name,
    fatherName: userObject.fatherName,
    surname: userObject.surname,
  });

const userConcisePostFIOString = (userObject) =>
  getUserConcisePostFIOString({
    post: userObject.post,
    name: userObject.name,
    fatherName: userObject.fatherName,
    surname: userObject.surname,
  });

module.exports = {
  getUserConciseFIOString,
  getUserFIOString,
  getUserPostFIOString,
  userPostFIOString,
  userConcisePostFIOString,
};
