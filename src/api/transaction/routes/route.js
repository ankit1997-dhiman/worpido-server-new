module.exports = {
  routes: [
    {
      method: "GET",
      path: "/my-transactions",
      handler: "transaction.myTransactions",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/withdrawal-request",
      handler: "transaction.newRequest",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
