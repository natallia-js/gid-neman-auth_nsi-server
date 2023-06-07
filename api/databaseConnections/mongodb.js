const mongoose = require('mongoose');

// "mongoURI": "mongodb://mongo-root:passw0rd@10.23.101.86:27017,10.23.101.202:27017/test?authSource=admin&replicaSet=rs0",
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
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  });
}

module.exports = connectToMongoDB;
