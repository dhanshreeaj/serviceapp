import { BrowserRouter as Router, Route, Routes,Navigate  } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import HomeServices from "./Adminhome";
import Home from "./Home";
import GoogleSuccess from "./GoogleSuccess";
import Services from "./Service";
import Success from "./Success";
import Feedback from "./Feedback";
import Chatbot from "./Chatbot";
import Chat from "./Clientchat";

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
        <Route path="/servicepage" element={<Services currentUserRole={""}/>}/>
        <Route path="/google-success" element={<GoogleSuccess />} />
        <Route path="/success" element={<Success/>}/>
        <Route path="/feedback" element={<Feedback/>}/>
        <Route path="/chatbot" element={<Chatbot/>}/>
        <Route path="/chatapplication" element={<Chat/>}/>
      </Routes>
    </Router>
  );
}

export default App;