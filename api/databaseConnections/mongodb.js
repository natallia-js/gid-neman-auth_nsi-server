const mongoose = require('mongoose');

async function connectToMongoDB(mongoURI) {
  await mongoose.connect(mongoURI, {
    // используем новый синтаксический анализатор (при этом в строке подключения необходимо указывать ПОРТ!)
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // значение true заставляет Mongoose использовать построение индекса по умолчанию с помощью createIndex(),
    // а не ensureIndex() - чтобы избежать deprecation warnings со стороны драйвера MongoDB
    useCreateIndex: true,
    // значение false заставляет методы findOneAndUpdate() и findOneAndRemove() использовать нативный 
    // findOneAndUpdate(), нежели findAndModify()
    useFindAndModify: false,
  });
}

module.exports = connectToMongoDB;
