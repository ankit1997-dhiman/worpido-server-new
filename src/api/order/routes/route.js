module.exports = {
  routes: [
    {
      method: "POST",
      path: "/create-order",
      handler: "order.createOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/send-order",
      handler: "order.sendOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/verify-razorpay-order",
      handler: "order.verifyRazorpayOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/verify-order",
      handler: "order.verifyStripeOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },

    {
      method: "GET",
      path: "/orders/info/:id",
      handler: "order.getOrderInfo",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/my-orders",
      handler: "order.myOrders",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
