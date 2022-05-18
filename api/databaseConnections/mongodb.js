const mongoose = require('mongoose');

async function connectToMongoDB(mongoURI) {
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
}

module.exports = connectToMongoDB;
