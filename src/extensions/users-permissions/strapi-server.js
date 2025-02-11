// src/extensions/users-permissions/strapi-server.js

module.exports = (plugin) => {
  /*******************************  CUSTOM CONTROLERS  ********************************/
  plugin.controllers.user.updateMe = async (ctx) => {
    try {
      const { id } = ctx.state.user;

      const userExist = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        id,
        {
          fields: ["id"],
        }
      );

      if (!userExist?.id) {
        ctx.unauthorized = { message: "User not found!" };
        return;
      }

      const dataToUpdate = ctx.request.body;
      if (
        dataToUpdate?.hasOwnProperty("provider") &&
        dataToUpdate?.hasOwnProperty("resetPasswordToken") &&
        dataToUpdate?.hasOwnProperty("confirmationToken") &&
        dataToUpdate?.hasOwnProperty("confirmed") &&
        dataToUpdate?.hasOwnProperty("blocked") &&
        dataToUpdate?.hasOwnProperty("role")
      ) {
        ctx.badRequest = { message: "Can't update sensitive fields!" };
        return;
      }

      const res = await strapi.entityService.update(
        "plugin::users-permissions.user",
        parseInt(id),
        {
          data: {
            ...dataToUpdate,
            ...(dataToUpdate?.currency && {
              currency: {
                connect: [
                  parseInt(
                    dataToUpdate?.currency?.id ?? dataToUpdate?.currency
                  ),
                ],
              },
            }),
            isProfileComplete:
              Boolean(dataToUpdate?.displayName) &&
              Boolean(dataToUpdate?.bio) &&
              Boolean(dataToUpdate?.skills) &&
              Boolean(dataToUpdate?.currency) &&
              Boolean(dataToUpdate?.profession)
                ? true
                : false,
          },
        }
      );
      ctx.body = { message: "OK" };
    } catch (error) {
      ctx.internalServerError = error;
    }
  };

  plugin.controllers.user.deleteAvatar = async (ctx) => {
    try {
      const { id } = ctx.state.user;

      const userExist = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        id,
        {
          fields: ["id"],
          populate: {
            avatar: {
              fields: ["id"],
            },
          },
        }
      );

      if (!userExist?.id) {
        ctx.unauthorized = { message: "User not found!" };
        return;
      }

      await strapi.entityService.delete(
        "plugin::upload.file",
        parseInt(userExist?.avatar?.id)
      );

      ctx.body = { message: "OK" };
    } catch (error) {
      ctx.internalServerError = error;
    }
  };

  plugin.controllers.user.fetchUserInfo = async (ctx) => {
    try {
      const { username } = ctx.params;

      const result = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          fields: [
            "displayName",
            "username",
            "email",
            "bio",
            "skills",
            "country",
            "createdAt",
          ],
          filters: {
            username: username,
          },
          populate: {
            avatar: {
              fields: ["url"],
            },
            gigs: {
              fields: ["title", "overview"],
              populate: {
                banner: {
                  fields: ["url"],
                },
              },
            },
            orders: {
              fields: ["review", "stars", "finishedAt"],
              populate: {
                gig: {
                  fields: ["title"],
                },
                buyer: {
                  fields: ["username"],
                  populate: {
                    avatar: {
                      fields: ["url"],
                    },
                  },
                },
              },
            },
          },
        }
      );
      if (result?.length) {
        ctx.body = result[0];
      } else {
        ctx.status = 404;
        ctx.body = { message: "User not found" };
      }
    } catch (error) {
      console.log(error);
      ctx.internalServerError = error;
    }
  };

  plugin.controllers.user.overview = async (ctx) => {
    try {
      const { id } = ctx.params;

      const gigs = await strapi.entityService.findMany("api::gig.gig", {
        filters: {
          seller: id,
        },
        populate: {
          orders: {
            fields: ["id"],
          },
        },
      });

      const orders = await strapi.entityService.findMany("api::order.order", {
        fields: ["status"],
        filters: {
          gig: {
            seller: id,
          },
        },
      });

      ctx.body = {
        orders: orders?.length,
        finishedOrders: orders?.filter((data) => data?.status == "finished")
          ?.length,
        activeOrders: orders?.filter((data) => data?.status == "ongoing")
          ?.length,
        gigs: gigs?.length,
      };
    } catch (error) {
      console.log(error);
      ctx.internalServerError = error;
    }
  };

  plugin.controllers.user.wallet = async (ctx) => {
    try {
      const { id } = ctx.state.user;

      let debit = 0;
      let credit = 0;

      const transactions = await strapi.entityService.findMany(
        "api::transaction.transaction",
        {
          filters: {
            beneficiary: id,
          },
          fields: [
            "amount",
            "purpose",
            "status",
            "channel",
            "transactionId",
            "description",
            "remarks",
          ],
          populate: {
            order: {
              fields: ["id", "title"],
              populate: {
                buyer: {
                  fields: ["username"],
                },
              },
            },
          },
        }
      );

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        if(["refund", "withdrawal"].includes(transaction?.purpose) && transaction?.status == "successful"){
          debit = debit + transaction?.amount
        }
        
        else if(["order"].includes(transaction?.purpose) && transaction?.status == "successful"){
          credit = credit + transaction?.amount
        }
      }

      ctx.body = credit - debit

    } catch (error) {
      console.log(error);
      ctx.internalServerError = error;
    }
  };

  /*******************************  CUSTOM ROUTES  ********************************/
  plugin.routes["content-api"].routes.push(
    {
      method: "PUT",
      path: "/users/update/me",
      handler: "user.updateMe",
      config: {
        prefix: "",
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/wallet",
      handler: "user.wallet",
      config: {
        prefix: "",
        policies: [],
      },
    },
    {
      method: "DELETE",
      path: "/avatar",
      handler: "user.deleteAvatar",
      config: {
        prefix: "",
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/users/view/:username",
      handler: "user.fetchUserInfo",
      config: {
        prefix: "",
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/overview/:id",
      handler: "user.overview",
      config: {
        prefix: "",
        policies: [],
      },
    }
  );

  return plugin;
};
