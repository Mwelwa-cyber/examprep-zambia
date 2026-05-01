const functions = require("firebase-functions");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ✅ YOUR 3 KEYS — already filled in for you!
const MOMO_SUBSCRIPTION_KEY = "5fb67aad7f9d4d2cb8334a5cd74d9849";
const MOMO_API_USER = "921162e6-eddc-4aa1-8c6d-f284f4e122b6";
const MOMO_API_KEY = "85c4617389af4b76b39f85f9d0630c5f";
const MOMO_ENV = "sandbox";

// 🔧 Helper: Get a fresh access token from MTN
async function getAccessToken() {
  const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64");
  const response = await axios.post(
    "https://sandbox.momodeveloper.mtn.com/collection/token/",
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
      },
    }
  );
  return response.data.access_token;
}

// 💰 Main Function: Request payment from a customer
exports.requestMoMoPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  try {
    const { phoneNumber, amount, orderId } = req.body;

    // Step A: Get access token
    const token = await getAccessToken();

    // Step B: Create a unique ID for this payment
    const paymentRef = uuidv4();

    // Step C: Ask MTN to charge the customer
    await axios.post(
      "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
      {
        amount: String(amount),
        currency: "EUR",
        externalId: orderId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phoneNumber,
        },
        payerMessage: "Payment for zedexams.com",
        payeeNote: "Exam payment",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": paymentRef,
          "X-Target-Environment": MOMO_ENV,
          "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      paymentRef: paymentRef,
      message: "Payment request sent!",
    });

  } catch (error) {
    console.error("MoMo Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Payment failed. Try again." });
  }
});