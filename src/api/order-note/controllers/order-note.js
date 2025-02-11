"use strict";

/**
 * order-note controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::order-note.order-note",
  ({ strapi }) => ({
    addNotes: async (ctx) => {
      try {
        const { note, order } = ctx.request.body;
        const res = await strapi.entityService.create(
          "api::order-note.order-note",
          {
            data: {
              note: note,
              order: {
                connect: [parseInt(order)],
              },
            },
          }
        );
        ctx.body = res;
      } catch (error) {
        ctx.internalServerError = error;
      }
    },
    getNotes: async (ctx) => {
      try {
        const res = await strapi.entityService.findMany(
          "api::order-note.order-note",
          {
            fields: ["note"],
            filters: {
              order: {
                id: ctx.params?.id,
              },
            },
          }
        );
        
        ctx.body = res;
      } catch (error) {
        ctx.internalServerError = error;
      }
    },
  })
);
