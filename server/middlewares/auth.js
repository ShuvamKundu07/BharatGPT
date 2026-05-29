import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async(req, res, next) => {
    let token = req.headers.authorization;

    // 1. Check if token even exists
    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    try {
        console.log("Original Token received:", token);

        // 2. If it has "Bearer ", slice it off to get the raw token string
        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        // 3. Clean any accidental quotes that localStorage might have attached
        token = token.replace(/^["']|["']$/g, '');
        
        console.log("Cleaned Token for verification:", token);
        console.log("JWT_SECRET used:", process.env.JWT_SECRET);

        // 4. Verify the raw token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId).select('-password'); // Exclude password for security

        if(!user){
            return res.status(401).json({success: false, message: "Not authorized, user not found"});
        }
        
        req.user = user;
        next();

    } catch(error) {
        // This log will print the EXACT reason it failed in your backend terminal
        console.error("JWT Verification failed because:", error.message);
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
}