const { validationResult } = require('express-validator');
const { UNPROCESSABLE_ENTITY } = require('../constants');

module.exports = (req, res, next) => {
  // Проводим проверку корректности переданных пользователем данных
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  // При ошибках валидации переданных пользователем данных возвращаем пользователю сообщения об ошибках

  return res.status(UNPROCESSABLE_ENTITY).json({
    // массив объектов, в которых обязательно должны быть поля param и msg
    errors: errors.array(),
    message: 'Указаны некорректные данные при выполнении действия',
  });
/*
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(UNPROCESSABLE_ENTITY).json({
    errors: extractedErrors,
    message: 'Указаны некорректные данные при выполнении действия',
  });*/
}
