const mongoose = require('mongoose');

module.exports = {};

module.exports.connectDB = async () => {
  await mongoose.connect(global.__MONGO_URI__, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true 
  });
}

module.exports.stopDB = async () => {
  await mongoose.disconnect();
}

module.exports.clearDB = async () => {
  await mongoose.connection.db.dropDatabase();
}