import React, { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });

    const token = res.data.token;
    const role = res.data.role; // ✅ get role from response

    if (!token || !role) {
      alert("Login failed: Missing token or role.");
      return;
    }

    alert(`Login successful as ${role}\nToken:\n${token}`);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    // ✅ Redirect based on role
    if (role === "admin") {
      navigate("/adminhome");
    } else {
      navigate("/home");
    }
  } catch (err: any) {
    console.error(err?.response?.data);
    alert(err?.response?.data?.error || "Login failed");
  }
};

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom, skyblue, #f9f9f9)", // 🎨 vertical gradient
        flexDirection: "column",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor:"skyblue",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "10px",
            transition: "background-color 0.3s ease",
          }}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: 'skyblue',
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Login;
