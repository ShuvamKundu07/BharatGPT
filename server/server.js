import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'


const app = express()

//Stripe Webhooks
app.post('/api/stripe',express.raw({type: 'application/json'}),stripeWebhooks)

// console.log("JWT SECRET =", process.env.JWT_SECRET);

// console.log("JWT =", process.env.JWT_SECRET);
// console.log("PUBLIC =", process.env.IMAGEKIT_PUBLIC_KEY);


//Middleware
// Middleware
const allowedOrigins = [
    'http://localhost:5173', // Vite local development
    'https://bharat-gpt-psi.vercel.app/' // Vercel production deployment
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json())


app.use(connectDB);

// Routes
app.get('/', (req, res)=> res.send('Server is Live!'))
app.use('/api/user', userRouter) 
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)


const PORT = process.env.PORT || 3000 

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})

export default app