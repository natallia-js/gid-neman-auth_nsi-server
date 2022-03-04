const getUserConciseFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name.charAt(0)}.${fatherName && fatherName.length ? fatherName.charAt(0) + '.': ''}`;
};

const getUserFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name}${fatherName ? ' ' + fatherName : ''}`;
};

const getUserPostFIOString = ({ post, name, fatherName, surname }) => {
  return `${post} ${getUserFIOString({ name, fatherName, surname })}`;
};

const userPostFIOString = (userObject) =>
  getUserPostFIOString({
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
};
