"use strict";

/**
 * chat-room controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::chat-room.chat-room",
  ({ strapi }) => ({
    myChats: async (ctx, next) => {
      try {
        const { user } = ctx.state;

        if (!user) {
          return ctx.unauthorized("You are not logged in.");
        }

        const res = await strapi.entityService.findMany(
          "api::chat-room.chat-room",
          {
            filters: {
              $or: [{ sender: { id: user.id } }, { receiver: { id: user.id } }],
            },
            populate: {
              sender: {
                fields: ["username", "displayName", "profession"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              receiver: {
                fields: ["username", "displayName", "profession"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              lastMessage: {
                fields: ["content", "createdAt", "updatedAt"],
                populate: {
                  sender: {
                    fields: ["username", "displayName"],
                    populate: {
                      avatar: {
                        fields: ["url"],
                      },
                    },
                  },
                },
              },
            },
          }
        );

        const chatRooms = res?.map((chat) => {
          return {
            chatId: chat?.id,
            name:
              chat?.sender?.id == user?.id
                ? chat?.receiver?.username
                : chat?.sender?.username,
            recentMessage:
              chat?.lastMessage?.sender?.id == user?.id
                ? `You: ${chat?.lastMessage?.content}`
                : !chat?.lastMessage?.sender?.id
                ? ""
                : `${chat?.lastMessage?.sender?.username}: ${chat?.lastMessage?.content}`,
            avatarUrl:
              chat?.sender?.id == user?.id
                ? chat?.receiver?.avatar?.url
                : chat?.sender?.avatar?.url,
          };
        });

        ctx.body = chatRooms;
      } catch (error) {
        ctx.internalServerError = error;
      }
    },

    getChatInfo: async (ctx, next) => {
      try {
        const { user } = ctx.state;

        if (!user) {
          return ctx.unauthorized("You are not logged in.");
        }

        const { username } = ctx.params;

        const receiver = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: {
              username: username,
            },
          }
        );
        if (!receiver?.length) {
          ctx.notFound = { message: "Receiver user not found!" };
          return;
        }

        const res = await strapi.entityService.findMany(
          "api::chat-room.chat-room",
          {
            filters: {
              $or: [
                {
                  $and: [
                    { sender: { id: user.id } },
                    { receiver: { username: username } },
                  ],
                },
                {
                  $and: [
                    { sender: { username: username } },
                    { receiver: { id: user.id } },
                  ],
                },
              ],
            },
            populate: {
              sender: {
                fields: ["username", "displayName"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              receiver: {
                fields: ["username", "displayName"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              lastMessage: {
                fields: ["content"],
                populate: {
                  sender: {
                    fields: ["username", "displayName"],
                    populate: {
                      avatar: {
                        fields: ["url"],
                      },
                    },
                  },
                },
              },
            },
          }
        );

        if (!res?.length) {
          try {
            const newRoom = await strapi
              .service("api::chat-room.chat-room")
              .createChatRoom({
                senderId: user?.id,
                receiverId: receiver[0]?.id,
              });
            ctx.body = newRoom;
          } catch (error) {
            console.log("Controller Error while creating chat room");
            console.log(error);
          }
        }

        if (res?.length) {
          ctx.body = res[0];
        }
      } catch (error) {
        ctx.internalServerError = error;
      }
    },

    newChat: async (ctx) => {
      try {
        const { receiverId } = ctx.body;
        await strapi.service("api::chat-room.chat-room").createChatRoom({
          senderId: ctx?.state?.user?.id,
          receiverId: receiverId,
        });
      } catch (error) {
        ctx.internalServerError = error;
      }
    },

    chatMessages: async (ctx) => {
      try {
        const { username } = ctx.params;
        const { from, to } = ctx.query;

        const receiver = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: {
              username: username,
            },
          }
        );

        if (!receiver?.length) {
          ctx.notFound("Receiver user not found!");
          return;
        }

        const existingRoom = await strapi
          .service("api::chat-room.chat-room")
          .findRoom({
            senderId: ctx?.state?.user?.id,
            receiverId: receiver[0]?.id,
          });

        if (existingRoom?.id) {
          const messages = await strapi.entityService.findMany(
            "api::message.message",
            {
              fields: ["content", "createdAt", "type"],
              filters: {
                room: {
                  id: existingRoom?.id,
                },
              },
              populate: {
                sender: {
                  fields: ["username", "displayName"],
                  populate: {
                    avatar: {
                      fields: ["url"],
                    },
                    currency: {
                      fields: ["symbol"],
                    },
                  },
                },
                order: {
                  fields: [
                    "title",
                    "requirements",
                    "isAccepted",
                    "isRejected",
                    "amount",
                    "deliveryDays",
                  ],
                },
                files: {
                  fields: ["url"],
                },
              },
            }
          );

          const res = await messages?.map((msg) => ({
            timestamp: msg?.createdAt,
            type: msg?.type,
            sender: {
              name: msg?.sender?.displayName || msg?.sender?.username,
              id: msg?.sender?.id,
            },
            text: msg?.content,
            files: msg?.files,
            order: msg?.order,
          }));
          ctx.body = res;
        } else {
          ctx.notFound("Chat room not found!");
          return;
        }
      } catch (error) {
        ctx.internalServerError = error;
      }
    },
  })
);
