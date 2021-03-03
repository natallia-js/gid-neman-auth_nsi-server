const express = require('express');
const config = require('config');
const mongoose = require('mongoose');


// Создаем объект приложения express
const app = express();

// express.json() is a method inbuilt in express to recognize the incoming Request Object
// as a JSON Object. This method is called as a middleware.
app.use(express.json({ extended: true }));

// CORS middleware
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}
app.use(allowCrossDomain);

// Маршрутизация
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/apps', require('./routes/apps.routes'));
app.use('/api/roles', require('./routes/roles.routes'));

// Порт сервера
const PORT = config.get('port') || 4000;

// mongodb://localhost:27017/test?connectTimeoutMS=1000&bufferCommands=false&authSource=otherdb

/**
 * Действия, которые необходимо выполнить для запуска сервера.
 */
async function start() {
  try {
    // Подключаемся с серверу БД
    await mongoose.connect(config.get('mongoURI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
/*
    const app = require('./models/App');
    const a = new app({ shortTitle: 'kkk', title: 'лыоаы ваоырвлао ылвоар ылваоы ваы', credentials: [
      {
        englAbbreviation: 'ааа',
        description: 'ddddddаааааааааааааааааddddddd'
      },
      {
        englAbbreviation: 'афыафыа',
        description: 'eeeeфыаф ы ыа ыва eeeeeфыафыафыаeeee'
      }
    ] })
    await a.save();
*/
    // Запускаем http-сервер на указанном порту
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

  } catch (e) {
    console.log('Server Error', e.message);
    process.exit(1);
  }
}

// Запускаем сервер
start();
