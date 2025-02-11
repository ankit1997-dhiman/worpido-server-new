module.exports = {
    routes: [
      {
        method: "POST",
        path: "/order-review",
        handler: "review.createReview",
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "GET",
        path: "/order-review/:orderId",
        handler: "review.getOrderReview",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ]
}