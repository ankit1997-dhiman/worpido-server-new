module.exports = {
  routes: [
    {
      method: "GET",
      path: "/my-chats",
      handler: "chat-room.myChats",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/new-chat",
      handler: "chat-room.newChat",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/chat-info/:username",
      handler: "chat-room.getChatInfo",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/chat/messages/:username",
      handler: "chat-room.chatMessages",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
