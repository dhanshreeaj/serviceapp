import React, {useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Service {
    id: number;
    title: string;
    image: string;
}

interface Booking {
    id: number;
    service: { title: string };
    category: string;
    date: string;
    time: string;
    address: string;
    price: number;
    status: string;
}

interface Props {
    currentUserRole: string;
}

interface FeedbackEntry {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  serviceTitle?:string;
  category?:string;
}


const statusFlow: Record<string, string> = {
    pending: "accepted",
    accepted: "completed",
    completed: "completed",
};

const services: Service[] = [
    { id: 1, title: "Women Salon", image: "/images/wspa.png" },
    { id: 2, title: "Men Salon", image: "/images/mens.png" },
    { id: 3, title: "AC & Appliance Repair", image: "/images/ac.png" },
    { id: 4, title: "Cleaning & Pest Control", image: "/images/clean.png" },
    { id: 5, title: "Electrician", image: "/images/elct.png" },
    { id: 6, title: "Walls & rooms paints", image: "/images/paint.png" },
];

const Services: React.FC<Props> = ({ }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [showBookingsTable, setShowBookingsTable] = useState(false);
    const navigate = useNavigate();
    <Services currentUserRole="service" />
const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
const [averageRating, setAverageRating] = useState<number>(0);

useEffect(() => {
  axios.get("http://localhost:5000/api/feedbacks")
    .then((res) => {
      setFeedbacks(res.data);
      const total = res.data.reduce((sum: number, fb: FeedbackEntry) => sum + fb.rating, 0);
      setAverageRating(res.data.length ? total / res.data.length : 0);
    })
    .catch((err) => {
      console.error("Failed to fetch feedbacks", err);
    });
}, []);

    const token = localStorage.getItem("token");
    let currentUserRole = "";

    if (token) {
        try {
            const decoded: any = JSON.parse(atob(token.split('.')[1]));
            currentUserRole = decoded.role;
        } catch (e) {
            console.error("Invalid token");
        }
    }

    // const isService = currentUserRole === "service";
    // const loggedIn = !!token;

    const isService = currentUserRole === "service";
    const loggedIn = !!token;

    const handleProfileClick = () => {
        console.log("Token:", token);
        console.log("Role:", currentUserRole);
        console.log("isService:", isService);

        if (loggedIn && isService) {
            axios
                .get("http://localhost:5000/api/bookings", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    setBookings(res.data);
                    setShowBookingsTable(true);
                })
                .catch((err) => {
                    console.error("Error fetching bookings:", err);
                    alert("Failed to fetch bookings for service provider.");
                });
        } else {
            alert("Access restricted to service providers only.");
        }
    };
    const buttonStyle: React.CSSProperties = {
        padding: "6px 10px",
        backgroundColor: "#00aaff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    };


    const updateStatus = (id: number, currentStatus: string, otp?: string) => {
        const newStatus = statusFlow[currentStatus];

        const dataToSend: any = { status: newStatus };
        if (otp) dataToSend.otp = otp;

        axios
            .patch(`http://localhost:5000/api/bookings/${id}`, dataToSend, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => {
                if (newStatus === "accepted") {
                    const otpFromServer = res.data.otp;
                    alert(`OTP for booking ID ${id}: ${otpFromServer}`);
                    setBookings((prev) =>
                        prev.map((b) =>
                            b.id === id ? { ...b, status: newStatus, otp: otpFromServer } : b
                        )
                    );
                } else {
                    setBookings((prev) =>
                        prev.map((b) =>
                            b.id === id ? { ...b, status: newStatus, otp: null } : b
                        )
                    );
                    alert("Booking marked as completed.");
                }
            })
            .catch((err) => {
                console.error("Failed to update status:", err);
                alert(err.response?.data?.error || "Failed to update booking.");
            });
    };


    const thStyle: React.CSSProperties = {
        padding: "12px",
        border: "1px solid #ddd",
        backgroundColor: "#f0f0f0",
    };

    const tdStyle: React.CSSProperties = {
        padding: "12px",
        border: "1px solid #ddd",
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
                        <span role="img" aria-label="login" onClick={() => navigate("/")}>🔐</span>
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
                    {isService && showBookingsTable ? (
                        <>
                            <h2 style={{ marginBottom: "25px", fontSize: "22px", fontWeight: "bold", color: "#333" }}>
                                Bookings Management
                            </h2>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Service</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Time</th>
                                        <th style={thStyle}>Address</th>
                                        <th style={thStyle}>Price</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id}>
                                            <td style={tdStyle}>{b.service?.title}</td>
                                            <td style={tdStyle}>{b.category}</td>
                                            <td style={tdStyle}>{b.date.slice(0, 10)}</td>
                                            <td style={tdStyle}>{b.time}</td>
                                            <td style={tdStyle}>{b.address}</td>
                                            <td style={tdStyle}>₹{b.price}</td>
                                            <td style={tdStyle}>{b.status}</td>
                                            <td style={tdStyle}>
                                                {b.status === "pending" && (
                                                    <button
                                                        style={buttonStyle}
                                                        onClick={() => updateStatus(b.id, b.status)}
                                                    >
                                                        Accept the Request
                                                    </button>
                                                )}

                                                {b.status === "accepted" && (
                                                    <button
                                                        style={buttonStyle}
                                                        onClick={() => {
                                                            const otp = prompt("Enter OTP sent to user:");
                                                            if (otp) updateStatus(b.id, b.status, otp);
                                                        }}
                                                    >
                                                        Complete Booking
                                                    </button>
                                                )}
                                                {b.status ==="done" &&(
                                                    <button
                                                    style={{...buttonStyle,backgroundColor:"green"}}
                                                    onClick={()=> navigate(`/feedback?bookingId=${b.id}`)}
                                                    >Feedback</button>
                                                )}
                                                <button
      onClick={() => {
        window.location.href = "/chatapplication";

      }}
      style={{
        padding: "8px 12px",
        backgroundColor: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Chat
    </button>
                                            </td>
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
            <div style={{ marginTop: "50px", padding: "30px", backgroundColor: "#f0f0f0", borderRadius: "12px" }}>
          <h2>⭐ Customer Feedback</h2>

          <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
            Average Rating:{" "}
            <span style={{ color: "#ffc107", fontSize: "20px" }}>
              {"★".repeat(Math.round(averageRating))} ({averageRating.toFixed(1)})
            </span>
          </p>

          {feedbacks.length === 0 ? (
            <p>No feedback available yet.</p>
          ) : (
            feedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  backgroundColor: "#fff",
                  marginBottom: "15px",
                  padding: "16px",
                  borderRadius: "10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <p style={{ marginBottom: "6px" }}>
                  <strong>{fb.userName}</strong> –{" "}
                  <span style={{ color: "#ffc107" }}>
                    {"★".repeat(fb.rating)}
                  </span>
                </p>
                <p style={{ margin: 0 }}>{fb.comment}</p>
                <p style={{ marginTop: "4px", fontStyle: "italic", color: "#666" }}>
      Service: {fb.serviceTitle || "N/A"} | Category: {fb.category || "N/A"}
    </p>
              </div>
            ))
          )}
        </div>
        </div>
    );
};

export default Services;
