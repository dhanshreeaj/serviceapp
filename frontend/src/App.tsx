import { BrowserRouter as Router, Route, Routes,Navigate  } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import HomeServices from "./Adminhome";
import Home from "./Home";
import GoogleSuccess from "./GoogleSuccess";

function App() {
  const role = localStorage.getItem("role") || "user"; // default to user if not logged in

  return (
    <Router>
      <Routes>
         <Route path="/" element={<Navigate to="login" replace />} />
         <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminhome" element={<HomeServices currentUserRole={role} />} />
        <Route path="/home" element={<Home/>}/>
        <Route path="/google-success" element={<GoogleSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;