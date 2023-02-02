import mongoose from 'mongoose';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected`.yellow.bold);
  } catch (err) {
    console.error(err.red.bold);
    process.exit(1);
  }
};

export default connectDB;
