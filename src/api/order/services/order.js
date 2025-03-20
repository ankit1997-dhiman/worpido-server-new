"use strict";

const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");
const { FRONTEND_URL, BACKEND_URL } = require("../../../../config/constants");

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::order.order", ({ strapi }) => ({
  getStripeLink: async ({ amount, currency, gigId, metadata }) => {
    try {
      const newUUID = uuidv4();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: "Payment",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: BACKEND_URL + `/api/verify-order?session_id=${newUUID}`,
        cancel_url: FRONTEND_URL + `/payment-failed/${newUUID}`,
      });

      await strapi.service("api::order.order").create({
        data: {
          gig: {
            connect: [parseInt(gigId)],
          },
          gateway: "stripe",
          type: metadata?.type,
          orderId: newUUID,
          amount: `${currency} ${Number(amount) / 100}`,
        },
      });
      return session;
    } catch (error) {
      throw error;
    }
  },
  getRazorpayLink: async ({ amount, currency, title }) => {
    try {
      if (!amount || !currency) {
        throw new Error("Amount and currency are required!");
      }

      const options = {
        amount: amount * 100, // Convert to paise
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);
      return { success: true, order };
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return { success: false, error: error.message };
    }
  },
  getPaypalLink: async ({ amount, currency, description }) => {
    try {
      const paypalBaseUrl = "https://api.paypal.com/v2/checkout/orders";
      const clientId = process.env.PAYPAL_CLIENT_ID; // Replace with your PayPal client ID

      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
            description: description,
          },
        ],
      };

      const response = await axios.post(paypalBaseUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientId}`,
        },
      });

      const approvalUrl = response.data.links.find(
        (link) => link.rel === "approve"
      );
      if (approvalUrl) {
        return approvalUrl.href;
      } else {
        throw new Error("No approval URL found in PayPal response.");
      }
    } catch (error) {
      throw new Error(`PayPal API error: ${error.message}`);
    }
  },
  verifyStripeOrder: async (params) => {
    try {
    } catch (error) {
      throw error;
    }
  },
}));
