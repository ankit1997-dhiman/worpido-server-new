"use strict";

/**
 * order controller
 */
const { FRONTEND_URL } = require("../../../../config/constants");
const pusher = require("../../../../config/pusher");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  createOrder: async (ctx, next) => {
    try {
      const { provider, gigId, amount, description, metadata } =
        ctx.request.body;
      let res;
      // let amount = 0;
      let currency;

      const gig = await strapi.entityService.findOne(
        "api::gig.gig",
        parseInt(gigId),
        {
          fields: [
            "id",
            "title",
            "fixedPrice",
            "hourlyPrice",
            "pricingTable",
            "pricingModel",
          ],
          populate: {
            seller: {
              populate: {
                currency: {
                  fields: ["isoCode"],
                },
              },
            },
          },
        }
      );

      if (!gig?.id) {
        return ctx.badRequest("Gig not found");
      }

      if (gig?.pricingModel == "hourly") {
        return ctx.badRequest("Hourly pricing is not supported yet");
      }

      // Create chat room
      try {
        await strapi.service("api::chat-room.chat-room").createChatRoom({
          senderId: ctx?.state?.user?.id,
          receiverId: gig?.seller?.id,
        });
      } catch (error) {
        console.log("Errrrrrrr");
        console.log(error);
      }

      currency = gig?.seller?.currency?.isoCode;

      // if (gig?.pricingModel == "fixed") {
      //   amount = gig?.fixedPrice;
      // }
      // if(gig?.pricingModel == "plans"){
      //   gig?.pricingTable?.hasOwnProperty("pricing")
      // }

      if (provider == "stripe") {
        res = await strapi.service("api::order.order").getStripeLink({
          amount: Number(amount) * 100,
          currency: currency,
          title: metadata?.title ?? "Workpido",
          metadata: metadata,
          gigId: gig?.id,
        });
      }
      if (provider == "razorpay") {
        res = await strapi.service("api::order.order").getRazorpayLink({
          amount: amount,
          currency: currency,
          title: metadata?.title ?? "Workpido",
        });
      }
      if (provider == "paypal") {
        res = await strapi.service("api::order.order").getPaypalLink({
          amount: amount,
          currency: currency,
          description: metadata?.title ?? "Workpido",
        });
      }

      ctx.body = res;
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  verifyStripeOrder: async (ctx) => {
    try {
      const { session_id } = ctx.query;
      console.log("sessionID");
      console.log(session_id);
      const order = await strapi.entityService.findMany("api::order.order", {
        filters: {
          orderId: session_id,
        },
      });

      console.log("Order");
      console.log(order);
      if (order?.length) {
        if (order[0]?.gateway == "stripe") {
          // const session = await stripe.checkout.sessions.retrieve(session_id);

          // console.log("Session")
          // console.log(session)

          await strapi.entityService.update(
            "api::order.order",
            parseInt(order[0]?.id),
            {
              data: {
                transactionId: "transactionID",
              },
            }
          );

          ctx.response.redirect(
            FRONTEND_URL + `/order-details/${order[0]?.orderId}`
          );
        }
      } else {
        ctx.response.redirect(
          FRONTEND_URL + `/payment-failed/${order[0]?.orderId}`
        );
      }
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  getOrderInfo: async (ctx, next) => {
    try {
      const { id } = ctx.request.params;
      const order = await strapi.entityService.findMany("api::order.order", {
        fields: [
          "transactionId",
          "orderId",
          "stars",
          "amount",
          "status",
          "createdAt",
          "requirements",
        ],
        filters: {
          orderId: id,
        },
        populate: {
          gig: {
            fields: [
              "title",
              "overview",
              "requirements",
              "description",
              "pricingModel",
              "pricingTable",
              "fixedPrice",
              "hourlyPrice",
              "faqs",
            ],
            populate: {
              seller: {
                fields: ["username", "displayName"],
                populate: {
                  avatar: {
                    fields: ["url"],
                  },
                },
              },
              banners: {
                fields: ["url"],
              },
              attachments: {
                fields: ["url"],
              },
            },
          },
          buyer: {
            fields: ["username", "displayName", "online"],
            populate: {
              avatar: {
                fields: ["url"],
              },
            },
          },
          attachments: {
            fields: ["previewUrl", "url", "name"],
          },
          notes: {
            fields: ["note"],
          },
        },
      });

      if (order?.length) {
        ctx.body = order[0];
      } else {
        ctx.notFound = { message: "No Order Found" };
      }
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  myOrders: async (ctx, next) => {
    try {
      const { user } = ctx.state;
      const { status } = ctx.query;

      if (!user) {
        ctx.unauthorized("You are not allowed to access this resource");
        return;
      }

      const res = await strapi.entityService.findMany("api::order.order", {
        filters: {
          $and: [
            { gig: { seller: user.id } },
            ...(status != "all" ? [{ status }] : []),
          ],
        },
        fields: ["amount", "status", "requirements", "orderId"],
        populate: {
          gig: {
            fields: [
              "id",
              "title",
              "deliveryDays",
              "fixedPrice",
              "hourlyPrice",
              "pricingModel",
            ],
            populate: {
              seller: {
                fields: ["id"],
              },
            },
          },
          buyer: {
            fields: ["username", "id", "displayName"],
            populate: {
              avatar: {
                fields: ["url"],
              },
            },
          },
        },
      });

      ctx.body = res;
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  sendOrder: async (ctx) => {
    try {
      console.log("SEND ORDER CONTROLLER");
      const { id } = ctx.state.user;

      console.log("SELLER " + id);

      const {
        requirements,
        deliveryDays,
        amount,
        title,
        category,
        subCategory,
        buyer,
      } = ctx.request.body;

      console.log(ctx.request.body);

      const sender = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        id,
        {
          fields: ["displayName", "username"],
        }
      );

      console.log("SENDER");
      console.log(sender);

      const receiver = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          fields: ["displayName", "username"],
          filters: {
            username: buyer,
          },
        }
      );

      console.log("RECEIVER");
      console.log(receiver);

      const order = await strapi.entityService.create("api::order.order", {
        fields: [
          "id",
          "title",
          "requirements",
          "deliveryDays",
          "amount",
          "isAccepted",
          "isRejected",
        ],
        data: {
          buyer: {
            connect: [parseInt(receiver[0]?.id)],
          },
          seller: {
            connect: [parseInt(id)],
          },
          category: {
            connect: [parseInt(category)],
          },
          subCategory: {
            connect: [parseInt(subCategory)],
          },
          title: title,
          amount: amount,
          deliveryDays: deliveryDays,
          requirements: requirements,
        },
      });

      const chatRoom = await strapi
        .service("api::chat-room.chat-room")
        .findRoom({ senderId: sender?.id, receiverId: receiver[0]?.id });

      console.log("CHAT ROOM");
      console.log(chatRoom);

      const message = await strapi.entityService.create(
        "api::message.message",
        {
          data: {
            type: "order",
            order: {
              connect: [parseInt(order?.id)],
            },
            sender: {
              connect: [parseInt(id)],
            },
            receiver: {
              connect: [parseInt(receiver[0]?.id)],
            },
            room: {
              connect: [parseInt(chatRoom?.id)],
            },
          },
          populate: {
            files: {
              fields: ["url"],
            },
            order: {
              fields: [
                "title",
                "requirements",
                "amount",
                "isAccepted",
                "isRejected",
                "deliveryDays",
              ],
            },
          },
        }
      );

      await pusher.trigger(receiver[0]?.username, "new-message", {
        content: requirements,
        sender: {
          id: sender?.id,
          name: sender?.displayName || sender?.username,
        },
        timestamp: message?.createdAt,
        files: message?.files,
        type: message?.type,
        order: message?.order,
      });

      await pusher.trigger(receiver[0]?.username, "chat-updated", {
        chatId: chatRoom?.id,
      });

      await pusher.trigger(sender?.username, "chat-updated", {
        chatId: chatRoom?.id,
      });

      ctx.body = { message: "OK" };
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
}));
