"use strict";

/**
 * service controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::service.service", ({ strapi }) => ({
  subcategoryServices: async (ctx) => {
    try {
      const { subcategory } = ctx.params;
      const services = await strapi.entityService.findMany(
        "api::service.service",
        {
          fields: ["id", "title"],
          filters: {
            subcategory: {
              title: {
                $eqi: subcategory,
              },
            },
          },
        }
      );
      ctx.body = services;
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
}));
