import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`DB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Failed to connect to DB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
