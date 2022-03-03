const {
  UNAUTHORIZED,
  USER_NOT_FOUND_ERR_MESS,
} = require('../constants');
const User = require('../models/User');


const getUserFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name.charAt(0)}.${fatherName && fatherName.length ? fatherName.charAt(0) + '.': ''}`;
};

const getUserPostFIOString = ({ post, name, fatherName, surname }) => {
  return `${post} ${getUserFIOString({ name, fatherName, surname })}`;
};

/**
 * Промежуточный обработчик получения информации о пользователе из БД на основании его id,
 * который содержится в req.user.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
async function getUserData(req, res, next) {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  const userData = req.user;

  try {
    // Ищем пользователя в БД
    const user = await User.findOne({ _id: userData.userId });
    if (!user) {
      return res.status(UNAUTHORIZED).json({ message: USER_NOT_FOUND_ERR_MESS });
    }
    req.user.postFIO = getUserPostFIOString({
      post: user.post,
      name: user.name,
      fatherName: user.fatherName,
      surname: user.surname,
    });
    next();

  } catch (e) {
    console.log(e)
    res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }
}


module.exports = {
  getUserFIOString,
  getUserPostFIOString,
  getUserData,
};
