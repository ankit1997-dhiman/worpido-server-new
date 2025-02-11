"use strict";

const pusher = require("../../../../config/pusher");

/**
 * message controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::message.message", ({ strapi }) => ({
  sendMessage: async (ctx) => {
    try {
      console.log("Send message triggered");
      const { receiver, content } = ctx.request.body;
      const { user } = ctx.state;

      if (!user) {
        ctx.unauthorized = {
          message: "You are not allowed to access this API",
        };
        return;
      }

      const sender = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        user?.id,
        {
          fields: ["displayName", "username"],
        }
      );

      if (!receiver?.id || !receiver?.username) {
        ctx.badRequest = { message: "Incomplete receiver info" };
        return;
      }

      const chatRoom = await strapi
        .service("api::chat-room.chat-room")
        .findRoom({
          senderId: user?.id,
          receiverId: parseInt(receiver?.id),
        });

      if (!chatRoom?.id) {
        ctx.notFound = { message: "Chat room not found!" };
        return;
      }

      const message = await strapi.entityService.create(
        "api::message.message",
        {
          fields: ["id", "createdAt"],
          data: {
            content: content?.trim(),
            sender: {
              connect: [user?.id],
            },
            receiver: {
              connect: [parseInt(receiver?.id)],
            },
            room: {
              connect: [chatRoom?.id],
            },
          },
          populate: {
            files: {
              fields: ["url"],
            },
          },
          sort: {
            createdAt: "asc",
          },
        }
      );

      await strapi.entityService.update(
        "api::chat-room.chat-room",
        chatRoom?.id,
        {
          data: {
            lastMessage: {
              set: [parseInt(message?.id)],
            },
          },
        }
      );

      await pusher.trigger(receiver?.username, "new-message", {
        content: content,
        sender: {
          id: sender?.id,
          name: sender?.displayName || sender?.username,
        },
        timestamp: message?.createdAt,
        files: message?.files,
      });

      await pusher.trigger(receiver?.username, "chat-updated", {
        chatId: chatRoom?.id,
      });

      await pusher.trigger(sender?.username, "chat-updated", {
        chatId: chatRoom?.id,
      });

      ctx.body = message;
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  typingStatus: async (ctx) => {
    const { isTyping, receiver, sender } = ctx.request.body;
    await pusher.trigger(receiver, "is-typing", {
      typing: isTyping,
      sender: sender,
      receiver: receiver
    });
    ctx.body = "OK";
  },
}));
