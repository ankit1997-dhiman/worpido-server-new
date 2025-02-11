"use strict";

/**
 * withdrawal-request controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::withdrawal-request.withdrawal-request",
  ({ strapi }) => ({
    myRequests: async (ctx) => {
      try {
        const { id } = ctx.state.user;

        const res = await strapi.entityService.findMany(
          "api::withdrawal-request.withdrawal-request",
          {
            fields: [
              "amount",
              "channel",
              "remarks",
              "status",
              "statusUpdatedAt",
            ],
            filters: {
              user: id,
            },
          }
        );

        ctx.body = res;
      } catch (error) {
        console.log(error);
        ctx.internalServerError = error;
      }
    },
  })
);
