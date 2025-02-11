module.exports = {
  routes: [
    {
      method: "GET",
      path: "/get-order-updates/:id",
      handler: "order-update.getUpdates",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/send-order-update",
      handler: "order-update.postUpdate",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
