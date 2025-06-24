import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

interface FeedbackEntry {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  serviceTitle?: string;
  category?: string;
}

const Feedback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [allFeedback, setAllFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setName(payload.name || "User");
    }

    axios.get("http://localhost:5000/api/feedbacks")
      .then((res) => setAllFeedback(res.data))
      .catch((err) => console.error("Failed to fetch feedbacks", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      alert("Missing booking ID!");
      return ;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/feedbacks",
        { rating, comment, bookingId:Number(bookingId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Feedback submitted!");
      setRating(0);
      setComment("");
      setAllFeedback((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback");
    }
  };
if (!bookingId || isNaN(Number(bookingId))) {
  alert("Invalid booking ID!");
  return null; // ← This fixes the TS2322 error
}


  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "auto", fontFamily: "Arial" }}>
      <h2>⭐ Share Your Feedback</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "24px", marginBottom: "12px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{ cursor: "pointer", color: rating >= star ? "#ffc107" : "#ccc" }}
            >
              ★
            </span>
          ))}
        </div>
        <textarea
          placeholder="Write your comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%", height: "80px", padding: "10px",
            fontSize: "15px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "12px"
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px", backgroundColor: "#00aaff",
            color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Feedback;
