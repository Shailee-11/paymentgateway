import React, { useState, useEffect } from "react";

const App = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    address: "",
    country: "",
    city: "",
    state: "",
    pincode: "",
    totalAmount: "",
    otp: "", // OTP field
  });

  const [razorpayKey, setRazorpayKey] = useState("");
  const [token, setToken] = useState("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // New state for form submission

  // Function to verify OTP and obtain token
  const verifyOTP = async (mobile, otp) => {
    const response = await fetch("https://api.testbuddy.live/v1/auth/verifyotp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobile, otp }),
    });

    if (!response.ok) {
      throw new Error("OTP verification failed");
    }

    const data = await response.json();
    return data.token; // Assuming the token is in the response
  };

  // Fetch the Razorpay Key when the token is available
  useEffect(() => {
    if (!token) return;

    const fetchRazorpayKey = async () => {
      try {
        const response = await fetch("https://api.testbuddy.live/v1/payment/key", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setRazorpayKey(data.key); // Assuming 'key' is returned in the response
      } catch (error) {
        console.error("Error fetching Razorpay key:", error);
      }
    };

    fetchRazorpayKey();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsFormSubmitted(true); // Set form submission state to true
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    try {
      // Verify OTP and get token
      const token = await verifyOTP(formData.mobile, formData.otp);
      setToken(token);
      localStorage.setItem("authToken", token);

      // Create Order
      const orderResponse = await fetch("https://api.testbuddy.live/v1/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: "6613d6fbbf1afca9aa1b519e", // Replace with actual package ID
          pricingId: "662caa2d50bf43b5cef75232", // Replace with actual pricing ID
          finalAmount: formData.totalAmount,
          couponCode: "NEET25", // Replace with actual coupon code if applicable
        }),
      });

      const orderData = await orderResponse.json();
      const options = {
        key: razorpayKey,
        amount: parseInt(formData.totalAmount) * 100, // Amount in paisa
        currency: "INR",
        name: "WEB CHECK",
        description: "for testing purpose",
        order_id: orderData.id, // Use the order ID returned from the API
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id;
          const signature = response.razorpay_signature;

          // Verify the order
          try {
            const verifyResponse = await fetch("https://api.testbuddy.live/v1/order/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                transactionId: orderData.id, // Use the order ID
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            console.log("Order verification response:", verifyData);

            // Reset the form after successful payment and verification
            setFormData({
              fname: "",
              lname: "",
              email: "",
              mobile: "",
              address: "",
              country: "",
              city: "",
              state: "",
              pincode: "",
              totalAmount: "",
              otp: "", // Reset OTP field
            });
            setIsFormSubmitted(false); // Reset form submission state
          } catch (verifyError) {
            console.error("Error verifying order:", verifyError);
          }
        },
        theme: {
          color: "#07a291db",
        },
      };

      const pay = new window.Razorpay(options);
      pay.open();
    } catch (orderError) {
      console.error("Error creating order:", orderError);
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card p-4 shadow-lg" style={{ width: "60%" }}>
        <h2 className="mb-4 text-center" style={{ color: "#07a291db" }}>
          Contact Form
        </h2>
        <form
          onSubmit={isFormSubmitted ? handleOTPSubmit : handleFormSubmit}
          className="d-flex justify-content-center"
          style={{ flexDirection: "column" }}
        >
          <div className="row">
            <div className="col-6">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="First Name"
                  name="fname"
                  value={formData.fname}
                  onChange={handleChange}
                  required
                  disabled={isFormSubmitted} // Disable input after form submission
                />
              </div>
            </div>
            <div className="col-6">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Last Name"
                  name="lname"
                  value={formData.lname}
                  onChange={handleChange}
                  required
                  disabled={isFormSubmitted} // Disable input after form submission
                />
              </div>
            </div>
            <div className="col-6">
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isFormSubmitted} // Disable input after form submission
                />
              </div>
            </div>
            <div className="col-6">
              <div className="mb-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Mobile"
                  name="mobile"
                  minLength={10}
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  disabled={isFormSubmitted} // Disable input after form submission
                />
              </div>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
            <div className="mb-3">
              <input
                type="number"
                className="form-control"
                placeholder="Total Amount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                disabled={isFormSubmitted} // Disable input after form submission
              />
            </div>
          </div>

          {isFormSubmitted && (
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter OTP"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#07a291db",
              borderColor: "#07a291db",
              fontSize: "19px",
            }}
            className="btn btn-primary"
          >
            {isFormSubmitted ? "Submit OTP" : "Checkout"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
