"use strict";

/**
 * review controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::review.review", ({ strapi }) => ({
  createReview: async (ctx) => {
    try {
      const { msg, rating, orderId, qualities } = ctx.request.body;
      const { id } = ctx.state.user;
      let author;

      const order = await strapi.entityService.findMany("api::order.order", {
        fields: ["id"],
        filters: {
          $and: [
            {
              id: orderId,
            },
            {
              $or: [
                {
                  gig: {
                    seller: { id: id },
                  },
                },
                {
                  buyer: { id: id },
                },
              ],
            },
          ],
        },
        populate: {
          gig: {
            fields: ["id"],
            populate: {
              seller: {
                fields: ["id"],
              },
            },
          },
          buyer: {
            fields: ["id"],
          },
        },
      });

      if (!order.length) {
        ctx.badRequest("Invalid order ID");
        return;
      }

      const existingReview = await strapi.entityService.findMany(
        "api::review.review",
        {
          fields: ["id"],
          filters: {
            $and: [
              {
                order: parseInt(orderId),
              },
              {
                $or: [
                  {
                    targetUser: id,
                  },
                  {
                    reviewedBy: id,
                  },
                ],
              },
            ],
          },
        }
      );

      if (existingReview.length) {
        ctx.badRequest("You have already left a review for this order");
        return;
      }

      if (id == order[0]?.gig?.seller?.id) {
        author = "seller";
      } else if (id == order[0]?.buyer?.id) {
        author = "buyer";
      }

      await strapi.entityService.create("api::order-update.order-update", {
        data: {
          updateType: "review",
          message: msg,
          order: {
            connect: [order[0]?.id],
          },
          sender: {
            connect: [id],
          },
        },
      });

      const res = await strapi.entityService.create("api::review.review", {
        data: {
          review: msg,
          rating: rating,
          qualities: qualities,
          gig: {
            connect: [order[0]?.gig?.id],
          },
          order: {
            connect: [order[0]?.id],
          },
          reviewedBy: {
            connect: [id],
          },
          targetUser: {
            connect:
              author == "buyer"
                ? [order[0]?.gig?.seller?.id]
                : [order[0]?.buyer?.id],
          },
        },
      });

      ctx.body = res;
    } catch (error) {
      console.log(error);
      ctx.internalServerError = error;
    }
  },

  getOrderReview: async (ctx) => {
    try {
      const { orderId } = ctx.params;
      const { id } = ctx.state.user;

      const res = await strapi.entityService.findMany("api::review.review", {
        fields: ["review", "reviewResponse", "createdAt", "rating"],
        filters: {
          $and: [
            {
              order: orderId,
            },
            {
              $or: [
                {
                  reviewedBy: id,
                },
                {
                  targetUser: id,
                },
              ],
            },
          ],
        },
        populate: {
          targetUser: {
            fields: ["id", "username"],
          },
          reviewedBy: {
            fields: ["id", "username"],
          },
        },
      });
      if (res.length) {
        res[0]["reviewedByMe"] =
          res[0]?.reviewedBy?.id == id || res[0]?.targetUser?.id == id;
      }
      ctx.body = res;
    } catch (error) {
      console.log(error);
      ctx.internalServerError = error;
    }
  },
}));
