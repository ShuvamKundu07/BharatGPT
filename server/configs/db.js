import mongoose from "mongoose";

let isConnected = false;

const connectDB = async (req, res, next) => {
    // 1. Disable command buffering globally
    mongoose.set('bufferCommands', false);

    // 2. If already securely linked, pass execution cleanly along to your routes
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return next();
    }

    try {
        console.log("Initializing database connection instance on Vercel...");
        
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Kill the operation after 5 seconds instead of waiting 10
        });
        
        isConnected = connectionInstance.connections[0].readyState === 1;
        console.log("Database connected smoothly!");
        
        return next(); // Continue down the pipeline to your controller
    } catch (error) {
        console.error("Critical: Database connection failed during request:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Database connection failed. Please try again." 
        });
    }
}

export default connectDB;