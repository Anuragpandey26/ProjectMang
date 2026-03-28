import mongoose from "mongoose";
import logger from "../services/logger.service.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info(`DB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Failed to connect to DB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
