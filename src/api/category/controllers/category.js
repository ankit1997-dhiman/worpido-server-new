"use strict";

/**
 * category controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::category.category",
  ({ strapi }) => ({
    getAllCategories: async (ctx, next) => {
      try {
        try {
          const result = await strapi.entityService.findMany(
            "api::category.category",
            {
              fields: ["title", "frontendLink"],
              filters: {
                isActive: true,
              },
              populate: {
                subCategories: {
                  fields: ["title", "frontendLink"],
                  filters: {
                    isActive: true,
                  },
                  populate: {
                    services: {
                      fields: ["title", "frontendLink"],
                      filters: {
                        isActive: true,
                      },
                      populate: {
                        serviceAttributes: {
                          fields: ["title", "frontendLink"],
                          filters: {
                            isActive: true,
                          },
                        },
                      },
                    },
                    cover: {
                      fields: ['url']
                    }
                  },
                },
                cover: {
                  fields: ['url']
                }
              },
            }
          );
          ctx.body = result;
        } catch (error) {
          console.log(error);
        }

        if (ctx.state.user.id) {
          console.log("Online user ", ctx.state.user.id)
          try {
            await strapi.entityService.update(
              "plugin::users-permissions.user",
              ctx.state.user.id,
              {
                data: {
                  online: true,
                },
              }
            );
          } catch (error) {
            console.log(error);
          }
        }

      } catch (error) {
        ctx.internalServerError = error;
      }
    },
  })
);
