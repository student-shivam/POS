const mongoose = require("mongoose");
require("colors");

const RETRY_DELAY_MS = 5000;

// connectDB Function
const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected ${conn.connection.host}`.bgYellow);
    return conn;
  } catch (error) {
    console.log(`Error : ${error.message}`.bgRed);
    console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`.bgRed);
    setTimeout(connectDb, RETRY_DELAY_MS);
    return null;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Reconnecting...".bgRed);
  setTimeout(connectDb, RETRY_DELAY_MS);
});

mongoose.connection.on("error", (error) => {
  console.log(`MongoDB error: ${error.message}`.bgRed);
});

// export
module.exports = connectDb;
