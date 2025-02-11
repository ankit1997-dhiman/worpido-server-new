"use strict";

/**
 * gig-view service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::gig-view.gig-view", ({ strapi }) => ({
  incrementView: async (userId, gigId) => {
    try {
      const gig = await strapi.entityService.findOne(
        "api::gig.gig",
        parseInt(gigId),
        {
          fields: ["id", "viewsCount"],
        }
      );
      
      if (!userId) {
        await strapi.entityService.update("api::gig.gig", parseInt(gigId), {
          data: {
            viewsCount: gig?.viewsCount + 1,
          },
        });

        return true;
      }

      const existingView = await strapi.entityService.findMany(
        "api::gig-view.gig-view",
        {
          fields: ["id", "views"],
          filters: {
            $and: [
              {
                user: userId,
              },
              {
                gig: parseInt(gigId),
              },
            ],
          },
        }
      );
      if (!existingView?.length) {
        await strapi.entityService.create("api::gig-view.gig-view", {
          data: {
            views: gig?.viewsCount + 1,
            gig: {
              connect: [parseInt(gigId)],
            },
            user: {
              connect: [parseInt(userId)],
            },
          },
        });
        return true;
      }
      await strapi.entityService.update(
        "api::gig-view.gig-view",
        existingView[0]?.id,
        {
          data: {
            views: existingView[0]?.views + 1,
          },
        }
      );
      await strapi.entityService.update("api::gig.gig", parseInt(gigId), {
        data: {
          viewsCount: gig?.viewsCount + 1,
        },
      });
      return true;
    } catch (error) {
      throw new Error("Err while incrementing views");
    }
  },
}));
