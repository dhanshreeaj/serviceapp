import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    const token = localStorage.getItem("token");

    if (bookingId && token) {
      // Optional: call backup PATCH route if webhook fails
      axios
        .patch(`http://localhost:5000/api/bookings/${bookingId}/mark-paid`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          alert("Payment successful! Booking marked as done.");
          navigate("/home");
        })
        .catch(() => {
          alert(" Payment succeeded, but status couldn't be updated.");
          navigate("/home");
        });
    } else {
      alert(" Payment completed. Redirecting...");
      navigate("/home");
    }
  }, []);

  return <p>Processing payment...</p>;
};

export default Success;


// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const Success = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     // ✅ Show popup
//     alert("✅ Payment successful! Thank you.");

//     // ✅ Optional: Wait before redirecting
//     setTimeout(() => {
//       navigate("/home");
//     }, 1500);
//   }, []);

//   return null;
// };

// export default Success;
