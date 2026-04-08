import mongoose from 'mongoose';

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Set it in Render environment variables.');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully');
};

export default connectDb;
