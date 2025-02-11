"use strict";

const pusher = require("../../../../config/pusher");

/**
 * chat-room service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::chat-room.chat-room",
  ({ strapi }) => ({
    createChatRoom: async (params) => {
      try {
        const { senderId, receiverId } = params;

        const existingRoom = await strapi.entityService.findMany(
          "api::chat-room.chat-room",
          {
            filters: {
              $or: [
                {
                  $and: [
                    { sender: { id: senderId } },
                    { receiver: { id: receiverId } },
                  ],
                },
                {
                  $and: [
                    { sender: { id: receiverId } },
                    { receiver: { id: senderId } },
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

        if (existingRoom?.length) {
          return existingRoom[0];
        }

        try {
          const room = await strapi.entityService.create(
            "api::chat-room.chat-room",
            {
              data: {
                sender: {
                  connect: [parseInt(senderId)],
                },
                receiver: {
                  connect: [parseInt(receiverId)],
                },
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

          await pusher.trigger(room?.sender?.username, "chat-updated", {
            chatId: room?.id,
          });

          await pusher.trigger(room?.receiver?.username, "chat-updated", {
            chatId: room?.id,
          });

          return room;
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        throw new Error("Error while creating a chat room");
      }
    },

    findRoom: async (params) => {
      try {
        const { senderId, receiverId } = params;

        const existingRoom = await strapi.entityService.findMany(
          "api::chat-room.chat-room",
          {
            filters: {
              $or: [
                {
                  $and: [
                    { sender: { id: senderId } },
                    { receiver: { id: receiverId } },
                  ],
                },
                {
                  $and: [
                    { sender: { id: receiverId } },
                    { receiver: { id: senderId } },
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

        if (existingRoom?.length) {
          return existingRoom[0];
        } else {
          throw new Error("Chat room not found!");
        }
      } catch (error) {
        throw new Error("Chat room not found!");
      }
    },
  })
);
