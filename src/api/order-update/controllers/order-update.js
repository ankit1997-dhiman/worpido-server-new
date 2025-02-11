"use strict";

/**
 * order-update controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::order-update.order-update",
  ({ strapi }) => ({
    getUpdates: async (ctx) => {
      try {
        const { id } = ctx.params;
        const res = await strapi.entityService.findMany(
          "api::order-update.order-update",
          {
            filters: {
              order: id,
            },
            fields: ["message", "createdAt", "updateType"],
            populate: {
              sender: {
                fields: ["username", "displayName"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              attachments: {
                fields: ["previewUrl", "url"],
              },
            },
            sort: {
              createdAt: "asc",
            },
          }
        );

        ctx.body = res;
      } catch (error) {
        console.log(error);
        ctx.internalServerError = error;
      }
    },
    postUpdate: async (ctx) => {
      try {
        const { orderId, message } = ctx.request.body;
        const { id } = ctx.state.user;
        try {
          const res = await strapi.entityService.create(
            "api::order-update.order-update",
            {
              fields: ["message"],
              data: {
                order: {
                  connect: [parseInt(orderId)],
                },
                sender: {
                  connect: [id],
                },
                message: message,
              },
            }
          );

          ctx.body = res;
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        ctx.internalServerError = error;
      }
    },
  })
);
