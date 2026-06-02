import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI
        if (!uri) {
            throw new Error('MONGODB_URI is not set in environment')
        }
        mongoose.connection.on('connected', () => console.log('Database connected'))
        await mongoose.connect(`${uri}/backend`);
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

export default connectDB;