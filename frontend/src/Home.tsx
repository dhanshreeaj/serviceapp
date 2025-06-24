import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";

interface Service {
  id: number;
  title: string;
  image: string;
}
const stripePromise = loadStripe("pk_test_51Rbft6RhIrRs4qfZ3trsV06j2pl06wa6Tu57fF7uKmoTZM348ctm0bPx1hfce7nvDef9cQTjL7V38UThpp2Nz49z00qQ6kAZFU");



const services: Service[] = [
  { id: 1, title: "Women Salon", image: "/images/wspa.png" },
  { id: 2, title: "Men Salon", image: "/images/mens.png" },
  { id: 3, title: "AC & Appliance Repair", image: "/images/ac.png" },
  { id: 4, title: "Cleaning & Pest Control", image: "/images/clean.png" },
  { id: 5, title: "Electrician", image: "/images/elct.png" },
  { id: 6, title: "Walls & rooms paints", image: "/images/paint.png" },
];
interface FeedbackEntry {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  serviceTitle?:string;
  category?:string;
}



const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    address: "",
    description: "",
    category: "",
    price: "",
  });
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

  const categoryMap: Record<string, Record<string, number>> = {
    "Women Salon": {
      "Salon for Women": 500,
      "Spa for Women": 1000,
      "Hair Studio for Women": 800,
      "Makeup & Styling Studio": 1500,
      "All": 4000,
    },
    "Men Salon": {
      "Haircut for Men": 300,
      "Shaving": 150,
      "Beard Styling": 250,
      "Men's Facial": 400,
      "All": 1500,
    },
    "AC & Appliance Repair": {
      "AC Repair": 1200,
      "Fridge Repair": 1000,
      "Washing Machine Repair": 900,
    },
    "Cleaning & Pest Control": {
      "Home Deep Cleaning": 2000,
      "Pest Control": 1500,
    },
    "Electrician": {
      "Fan Repair": 200,
      "Wiring": 500,
      "Switch Board Fix": 300,
    },
    "Walls & rooms paints": {
      "Interior Painting": 2500,
      "Exterior Painting": 3000,
      "Room Touch-up": 1500,
    },
  };
  const [showBookings, setShowBookings] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [otpPopup, setOtpPopup] = useState<{ otp: string, bookingId: number } | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem("token"); // 👈 get JWT from localStorage
    if (!token) {
      alert("Please log in to view bookings");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/api/bookings/user/1", {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 attach token
        },
      });
      setBookings(response.data);
      setShowBookings(true);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      alert("Failed to fetch your bookings.");
    }
  };
  const statusFlow: Record<string, string> = {
    pending: "accepted",
    accepted: "completed",
    completed: "completed",
  };
  const updateStatus = (id: number, currentStatus: string) => {
    const newStatus = statusFlow[currentStatus];

    if (newStatus === "accepted") {
      axios
        .patch(`http://localhost:5000/api/bookings/${id}`, { status: newStatus }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          const otp = res.data.otp;

          // 👇 SET POPUP
          setOtpPopup({ otp, bookingId: id });

          // Update booking state
          setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: newStatus, otp } : b))
          );
        })
        .catch((err) => console.error("Failed to update status:", err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      const token = localStorage.getItem("token");
      const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
      const userId = payload?.id;

      if (!userId) {
        alert("User not logged in");
        return;
      }

      await axios.post("http://localhost:5000/api/bookings", {
        userId,
        serviceId: selectedService.id,
        ...formData,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Booking submitted!");
      setSelectedService(null);
      setFormData({
        date: "", time: "", address: "", description: "", category: "", price: "",
      });
    } catch (error) {
      alert("Failed to submit booking.");
      console.error(error);
    }
  };

  const handlePayment = async (bookingId: number) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/payments/create-checkout-session",
      { bookingId },
      {
        headers: { Authorization: `Bearer${token}` },
      }
    );
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: res.data.id });
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* ✅ Navigation Bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 40px",
          backgroundColor: "#00aaff",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
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
            outline: "none",
            width: "300px",
            fontSize: "14px",
          }}
        />
        <div style={{ display: "flex", gap: "20px", fontSize: "24px", cursor: "pointer" }}>
          <span title="Cart">🛒</span>
          <span title="Profile" onClick={fetchBookings}>👤</span>
        </div>
      </nav>

      {/* ✅ Services & Form */}
      <div style={{ padding: "40px" }}>
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "30px",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ marginBottom: "25px", fontSize: "20px", fontWeight: "bold", color: "#333" }}>
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
                onClick={() => setSelectedService(service)}
                style={{
                  backgroundColor: selectedService?.id === service.id ? "#d0f0ff" : "#f5f5f5",
                  padding: "16px",
                  borderRadius: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                  transition: "0.2s ease",
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{ width: "60px", height: "60px", marginBottom: "10px" }}
                />
                <p style={{ fontSize: "14px", fontWeight: "bold" }}>{service.title}</p>
              </div>
            ))}
          </div>


          {/* ✅ Booking Form */}
          {selectedService && (
            <form onSubmit={handleSubmit} style={{ marginTop: "40px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", color: "#444" }}>
                Book: {selectedService.title}
              </h3>

              <input type="date" name="date" value={formData.date} onChange={handleChange} required style={inputStyle} />
              <input type="time" name="time" value={formData.time} onChange={handleChange} required style={inputStyle} />
              <input type="text" name="address" value={formData.address} placeholder="Enter address" onChange={handleChange} required style={inputStyle} />
              <textarea name="description" value={formData.description} placeholder="Describe your issue" onChange={handleChange} required style={{ ...inputStyle, height: "80px" }} />

              {selectedService && (
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    const price = categoryMap[selectedService.title]?.[category] || 0;
                    setFormData({ ...formData, category, price: price.toString() });
                  }}
                  required
                  style={inputStyle}
                >
                  <option value="">Select Category</option>
                  {Object.keys(categoryMap[selectedService.title] || {}).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}


              <input
                type="text"
                name="price"
                value={`₹ ${formData.price}`}
                readOnly
                style={{ ...inputStyle, backgroundColor: "#eee", cursor: "not-allowed" }}
              />

              <button type="submit" style={{
                padding: "10px 20px",
                backgroundColor: "#00aaff",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                marginTop: "10px",
              }}>
                Submit Request
              </button>
            </form>

          )}
        </div>
        

        {showBookings && bookings.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Your Bookings</h3>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  padding: "10px",
                  marginBottom: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p><strong>Service:</strong> {booking.service?.title || "Unknown"}</p>
                <p><strong>Category:</strong> {booking.category}</p>
                <p><strong>Date:</strong> {booking.date.slice(0, 10)}</p>
                <p><strong>Time:</strong> {booking.time}</p>
                <p><strong>Address:</strong> {booking.address}</p>
                <p><strong>Price:</strong> ₹{booking.price}</p>
                <p><strong>Status:</strong> {booking.status}</p>
                {booking.status === "accepted" && (
  <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
    <button
      onClick={async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.patch(
            `http://localhost:5000/api/bookings/${booking.id}/otp`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const generatedOtp = res.data.otp;
          setOtpPopup({ otp: generatedOtp, bookingId: booking.id });
        } catch (err) {
          alert("Failed to generate OTP.");
          console.error(err);
        }
      }}
      style={{
        padding: "8px 12px",
        backgroundColor: "#00aaff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Get OTP
    </button>

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
  </div>
)}

                {booking.status === "completed" && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      const res = await axios.post(
                        "http://localhost:5000/api/payments/create-checkout-session",
                        { bookingId: booking.id },
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );

                      const stripe = await loadStripe("pk_test_51Rbft6RhIrRs4qfZ3trsV06j2pl06wa6Tu57fF7uKmoTZM348ctm0bPx1hfce7nvDef9cQTjL7V38UThpp2Nz49z00qQ6kAZFU");
                      await stripe?.redirectToCheckout({ sessionId: res.data.id });
                    }}
                    style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      backgroundColor: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Pay Now
                  </button>
                )}
                {booking.status === "done" && (
                  <div style={{ margin: "10px" }}>
                    <span style={{ color: "green", fontWeight: "bold" }}>Payment Completed.</span>
                    <br />
                    <button onClick={() => navigate(`/feedback?bookingId=${booking.id}`)}
                      style={{
                        marginTop: "8px",
                        padding: "6px 12px",
                        backgroundColor: "skyblue",
                        color: "black",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}>
                      Feedback
                    </button>
                  </div>
                )}
                {otpPopup && (
                  <div style={{
                    position: "fixed",
                    top: "0",
                    left: "0",
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 999,
                  }}>
                    <div style={{
                      backgroundColor: "#fff",
                      padding: "30px",
                      borderRadius: "12px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                      textAlign: "center",
                      maxWidth: "300px"
                    }}>
                      <h3> Your OTP</h3>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: "#00aaff" }}>
                        {otpPopup.otp}
                      </p>
                      <button
                        onClick={() => setOtpPopup(null)}
                        style={{
                          marginTop: "20px",
                          padding: "8px 16px",
                          backgroundColor: "#00aaff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                    </div>
                    
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
        <div
  onClick={() => navigate("/chatbot")}
  style={{
    position: "fixed",
    bottom: "30px",
    right: "30px",
    backgroundColor: "#00aaff",
    color: "#fff",
    padding: "14px 16px",
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    fontSize: "24px",
    zIndex: 999,
  }}
  title="Chat with Assistant"
>
  💬
</div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

export default Home;
