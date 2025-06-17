import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Service {
  id: number;
  title: string;
  image: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  currentUserRole: string;
}

const services: Service[] = [
  { id: 1, title: "Women Salon", image: "/images/wspa.png" },
  { id: 2, title: "Men Salon", image: "/images/mens.png" },
  { id: 3, title: "AC & Appliance Repair", image: "/images/ac.png" },
  { id: 4, title: "Cleaning & Pest Control", image: "/images/clean.png" },
  { id: 5, title: "Electrician", image: "/images/elct.png" },
  { id: 6, title: "Walls & rooms paints", image: "/images/paint.png" },
];

const HomeServices: React.FC<Props> = ({ currentUserRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showUsersTable, setShowUsersTable] = useState(false);
  const navigate = useNavigate();

  const isAdmin = currentUserRole === "admin";
  const loggedIn = !!localStorage.getItem("token");

useEffect(() => {
  if (isAdmin && showUsersTable) {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }
}, [isAdmin, showUsersTable]);

  const handleProfileClick = () => {
    if (isAdmin) {
      setShowUsersTable(true); // Show table for admin
    } else {
      navigate("/login"); // Navigate for regular user
    }
  };

  const handleLoginClick = () => {
    navigate("/");
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      {/* ✅ Navigation Bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 40px",
          backgroundColor: "skyblue",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: "bold" }}>🏠 Home Services</h1>

        <input
          type="text"
          placeholder="Search services..."
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            width: "300px",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: "20px", fontSize: "24px", cursor: "pointer" }}>
          <span role="img" aria-label="cart">🛒</span>
          {loggedIn ? (
            <span role="img" aria-label="profile" onClick={handleProfileClick}>👤</span>
          ) : (
            <span role="img" aria-label="login" onClick={handleLoginClick}>🔐</span>
          )}
        </div>
      </nav>

      {/* ✅ Content */}
      <div style={{ padding: "40px" }}>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "30px",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {isAdmin && showUsersTable ? (
            <>
              <h2 style={{ marginBottom: "25px", fontSize: "22px", fontWeight: "bold", color: "#333" }}>
                Users with Role: <span style={{ color: "green" }}>"user"</span>
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "12px", border: "1px solid #ddd" }}>ID</th>
                    <th style={{ padding: "12px", border: "1px solid #ddd" }}>Name</th>
                    <th style={{ padding: "12px", border: "1px solid #ddd" }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) => user.role === "user")
                    .map((user) => (
                      <tr key={user.id}>
                        <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.id}</td>
                        <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.name}</td>
                        <td style={{ padding: "12px", border: "1px solid #ddd" }}>{user.email}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: "25px", fontSize: "22px", fontWeight: "bold", color: "#333" }}>
                What are you looking for?
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "20px",
                }}
              >
                {services.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "16px",
                      borderRadius: "12px",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{ width: "60px", height: "60px", marginBottom: "10px" }}
                    />
                    <p style={{ fontSize: "14px", margin: 0 }}>{service.title}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeServices;
