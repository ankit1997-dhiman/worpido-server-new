module.exports = {
    routes: [
      {
        method: "GET",
        path: "/my-requests",
        handler: "withdrawal-request.myRequests",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  