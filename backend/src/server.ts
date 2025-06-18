import express from "express";
import session from 'express-session';
import passport from './config/passport'; 
import cors from "cors";
import bodyParser from 'body-parser';
import authRoutes from "./routes/auth"; // ✅ you are importing the router
import homeRoutes from "./routes/home";
import userRoutes from "./routes/users";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Using the whole router object, not a post/get call directly
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/users", userRoutes);

app.use(
  session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});