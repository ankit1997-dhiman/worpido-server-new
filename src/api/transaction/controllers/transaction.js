"use strict";

/**
 * transaction controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::transaction.transaction",
  ({ strapi }) => ({
    myTransactions: async (ctx) => {
      try {
        const { id } = ctx.state.user;

        const res = await strapi.entityService.findMany(
          "api::transaction.transaction",
          {
            fields: [
              "amount",
              "channel",
              "createdAt",
              "updatedAt",
              "purpose",
              "status",
              "transactionId",
            ],
            filters: {
              beneficiary: id,
            }
          }
        );

        ctx.body = res;
      } catch (error) {
        console.log(error);
        ctx.internalServerError = error;
      }
    },

    newRequest: async (ctx) => {
      try {
        const { id } = ctx.state.user;
        const { amount } = ctx.request.body;

        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          id,
          {
            fields: ["paypalEmail"],
            populate: {
              currency: {
                fields: ['id']
              }
            }
          }
        );

        if(!user?.paypalEmail){
          ctx.badRequest("Please add your Paypal Email address")
          return
        }

        const res = await strapi.entityService.create("api::transaction.transaction", {
          data: {
            currency: {
              connect: [user?.currency?.id]
            },
            amount: amount,
            beneficiary: {
              connect: [id]
            },
            status: "pending",
            purpose: "withdrawal",
            description: "Withdrawal to Paypal"
          }
        })

        ctx.body = res

      } catch (error) {
        ctx.internalServerError = error;
      }
    },
  })
);
