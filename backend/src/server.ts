import express from "express";
import cors from "cors";
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
