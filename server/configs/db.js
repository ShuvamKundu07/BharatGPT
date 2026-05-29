import mongoose from "mongoose";

// Keep track of connection state globally across serverless execution lifecycles
let isConnected = false;

const connectDB = async () => {
    // 1. Tell Mongoose NOT to buffer commands. 
    // If connection drops, fail instantly instead of freezing Vercel for 10 seconds.
    mongoose.set('bufferCommands', false);

    // 2. If already connected, reuse the active connection pool
    if (isConnected) {
        console.log("Using existing MongoDB connection pool.");
        return;
    }

    try {
        console.log("Creating fresh connection to MongoDB Atlas...");
        
        // 3. Clean up the string parsing: pass process.env.MONGODB_URI raw.
        // Make sure your Vercel Environment Variable has the database name baked into it!
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        
        isConnected = connectionInstance.connections[0].readyState === 1;
        console.log(`MongoDB connected !!! DB host : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        // Throwing the error alerts Vercel immediately so it can retry safely
        throw error; 
    }
}

export default connectDB;