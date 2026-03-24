const express = require("express");
const axios = require("axios");

const router = express.Router();

const KONNECT_INIT_PATH = "/api/v2/payments/init-payment";

router.post("/initiate", async (req, res) => {
  try {
    const { serviceId, orderId, returnUrl } = req.body || {};

    if (!serviceId || !orderId || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: "serviceId, orderId, and returnUrl are required.",
      });
    }

    if (!process.env.KONNECT_API_KEY || !process.env.KONNECT_WALLET_ID) {
      return res.status(500).json({
        success: false,
        error: "Missing KONNECT_API_KEY or KONNECT_WALLET_ID.",
      });
    }

    const baseUrl = (process.env.KONNECT_BASE_URL || "https://api.preprod.konnect.network").replace(/\/$/, "");

    const successUrl = new URL(returnUrl);
    successUrl.searchParams.set("serviceId", serviceId);
    successUrl.searchParams.set("orderId", orderId);
    successUrl.searchParams.set("paid", "true");

    const failUrl = new URL(returnUrl);
    failUrl.searchParams.set("serviceId", serviceId);
    failUrl.searchParams.set("orderId", orderId);
    failUrl.searchParams.set("paid", "false");

    const payload = {
      receiverWalletId: process.env.KONNECT_WALLET_ID,
      token: "TND",
      amount: 1000,
      type: "immediate",
      description: `SERVICE_TOUNSI payment for ${serviceId}`,
      orderId,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      checkoutForm: true,
      addPaymentFeesToAmount: true,
      lifespan: 10,
      successUrl: successUrl.toString(),
      failUrl: failUrl.toString(),
    };

    const { data } = await axios.post(`${baseUrl}${KONNECT_INIT_PATH}`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.KONNECT_API_KEY,
      },
      timeout: 30000,
    });

    const paymentUrl =
      data.payUrl ||
      data.paymentUrl ||
      data.checkoutUrl ||
      data.redirectUrl ||
      (data.result && (data.result.payUrl || data.result.paymentUrl));

    if (!paymentUrl) {
      return res.status(502).json({
        success: false,
        error: "Konnect did not return a payment URL.",
      });
    }

    return res.json({
      success: true,
      paymentUrl,
    });
  } catch (error) {
    console.error("Payment initiate error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to initiate payment.",
      details: error.response?.data || error.message,
    });
  }
});

router.get("/confirm", (req, res) => {
  const serviceId = req.query.serviceId || null;
  const orderId = req.query.orderId || null;

  const statusToken = String(req.query.paid || req.query.payment_status || req.query.status || "true").toLowerCase();
  const paidValues = ["true", "paid", "success", "successful", "completed"];
  const paid = paidValues.includes(statusToken);

  return res.json({
    paid,
    serviceId,
    orderId,
  });
});

module.exports = router;
