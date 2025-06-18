import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface FormData {
  name: string;
  email: string;
  password: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registration successful. Please enter the OTP sent to your email.");
      setShowOtpInput(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleOtpVerify = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/verify-email", {
        email: form.email,
        otp,
      });
      alert("Email verified successfully!");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "OTP verification failed");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, skyblue, #f9f9f9)",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>Register</h2>

        {!showOtpInput ? (
          <>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>
              Register
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="button" onClick={handleOtpVerify} style={buttonStyle}>
              Verify OTP
            </button>
          </>
        )}
      </form>
    </div>
  );
};

// Reusable styles
const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "skyblue",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background-color 0.3s ease",
};

export default Register;
