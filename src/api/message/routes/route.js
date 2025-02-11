module.exports = {
  routes: [
    {
      method: "POST",
      path: "/send-message",
      handler: "message.sendMessage",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/typing-status",
      handler: "message.typingStatus",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
