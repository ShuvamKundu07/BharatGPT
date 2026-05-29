import mongoose from "mongoose";

const connectDB = async() =>{
    try{
        // mongoose.connection.on('connected', ()=>console.log('Database connected'))
        // await mongoose.connect(`${process.env.MONGODB_URI}/bharatgpt`)
        // console.log("Connecting to:", process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/bharatgpt`);
        console.log(`MongoDB connected !!! DB host : ${connectionInstance.connection.host}`);
    }catch(error){
        console.log(error.message)
    }
}


export default connectDB;