import React from "react";

interface Service {
  id: number;
  title: string;
  image: string;
}

const services: Service[] = [
  { id: 1, title: "Women Salon", image: "/images/wspa.png" },
  { id: 2, title: "Men Salon", image: "/images/mens.png" },
  { id: 3, title: "AC & Appliance Repair", image: "/images/ac.png" },
  { id: 4, title: "Cleaning & Pest Control", image: "/images/clean.png"},
  { id: 5, title: "Electrician", image: "/images/elct.png" },
  { id: 6, title: "Walls & rooms paints", image: "/images/paint.png" },
];

const Home: React.FC = () => {
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
        {/* Logo & Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold" }}>🏠 Home Services</h1>
        </div>

        {/* Search Bar */}
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

        {/* Icons with emojis */}
        <div style={{ display: "flex", gap: "20px", fontSize: "24px", cursor: "pointer" }}>
          <span role="img" aria-label="cart">🛒</span>
          <span role="img" aria-label="profile">👤</span>
        </div>
      </nav>

      {/* ✅ Services Section */}
      <div style={{ padding: "40px" }}>
        <div
          style={{
            maxWidth: "750px",
            margin: "0 auto",
            padding: "30px",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
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
                  position: "relative",
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{ width: "60px", height: "60px", marginBottom: "10px" }}
                />
                <p style={{ fontSize: "14px", margin: 0 }}>
                  
                  
                  
                  {service.title}</p>
               
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
