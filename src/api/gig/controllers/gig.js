"use strict";

/**
 * gig controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::gig.gig", ({ strapi }) => ({
  create: async (ctx) => {
    try {
      const { request } = ctx;
      const {data} = request.body;
      const { id } = ctx.state.user;
      // Perform custom validation or modification of data here

      const parsedData = JSON.parse(data)
      console.log(parsedData)

      const createdItem = await strapi.service("api::gig.gig").create({
        data: { ...parsedData, seller: { connect: [id] } },
      });

      ctx.created({ data: createdItem });
    } catch (err) {
      console.log(err);
      ctx.badRequest("Error while creating Gig");
    }
  },
  viewActiveGigs: async (ctx) => {
    try {
      const { category } = ctx.params;
      const {
        minPrice,
        maxPrice,
        sellerLevel,
        sellerActivity,
        positiveReviews,
        ordered,
        viewed,
        maxDeliveryDays,
        ordersInProgress,
        search,
        limit,
        exception,
        service,
      } = ctx.query;

      console.log(service)

      const searchCategory = category?.toLowerCase()?.replace(/-/g, " ");

      try {
        const activeGigs = await strapi.entityService.findMany("api::gig.gig", {
          fields: [
            "id",
            "title",
            "revisions",
            "deliveryDays",
            "minPrice",
            "maxPrice",
            "fixedPrice",
            "hourlyPrice",
            "pricingModel",
            "isActive",
          ],
          filters: {
            $and: [
              { status: "active" },
              { isActive: true },
              {
                seller: {
                  acceptingOrders: true,
                },
              },
              ...(exception
                ? [
                    {
                      id: {
                        $not: exception,
                      },
                    },
                  ]
                : []),
              ...(search
                ? [
                    {
                      title: {
                        $containsi: search,
                      },
                    },
                  ]
                : []),
              ...(minPrice
                ? [
                    {
                      minPrice: {
                        $gte: parseInt(minPrice),
                      },
                    },
                  ]
                : []),
              ...(service
                ? [
                    {
                      services: service,
                    },
                  ]
                : []),
              ...(maxPrice
                ? [
                    {
                      maxPrice: {
                        $lte: parseInt(maxPrice),
                      },
                    },
                  ]
                : []),
              ...(maxDeliveryDays
                ? [
                    {
                      deliveryDays: {
                        $lte: parseInt(maxDeliveryDays),
                      },
                    },
                  ]
                : []),
              ...(sellerLevel
                ? [
                    {
                      seller: {
                        level: sellerLevel,
                      },
                    },
                  ]
                : []),
              ...(positiveReviews
                ? [
                    {
                      positiveReviews: {
                        $gte: parseInt(positiveReviews),
                      },
                    },
                  ]
                : []),
              ...(ordered == "true" && ctx.state?.user?.id
                ? [
                    {
                      orders: {
                        buyer: {
                          id: ctx.state?.user?.id,
                        },
                      },
                    },
                  ]
                : ordered == "false" && ctx.state?.user?.id
                ? [
                    {
                      orders: {
                        buyer: {
                          id: {
                            $ne: ctx.state?.user?.id,
                          },
                        },
                      },
                    },
                  ]
                : []),
              ...(viewed == "true" && ctx.state?.user?.id
                ? [
                    {
                      views: {
                        seller: {
                          id: ctx.state?.user?.id,
                        },
                      },
                    },
                  ]
                : viewed == "false" && ctx.state?.user?.id
                ? [
                    {
                      views: {
                        seller: {
                          id: {
                            $ne: ctx.state?.user?.id,
                          },
                        },
                      },
                    },
                  ]
                : []),
              ...(sellerActivity == "online"
                ? [
                    {
                      seller: {
                        online: true,
                      },
                    },
                  ]
                : parseInt(sellerActivity) >= 0
                ? [
                    {
                      seller: {
                        updatedAt: {
                          $gte: new Date(
                            new Date().setDate(
                              new Date().getDate() - parseInt(sellerActivity)
                            )
                          ).toISOString(),
                        },
                      },
                    },
                  ]
                : []),
              {
                ...(searchCategory != "all" && {
                  $or: [
                    {
                      category: {
                        $or: [
                          {
                            title: { $eqi: searchCategory },
                          },
                          {
                            title: { $eqi: category },
                          },
                        ],
                      },
                    },
                    {
                      subCategory: {
                        $or: [
                          {
                            title: { $eqi: searchCategory },
                          },
                          {
                            title: { $eqi: category },
                          },
                        ],
                      },
                    },
                  ],
                }),
              },
            ],
          },
          populate: {
            seller: {
              fields: ["displayName", "username", "createdAt", "country"],
              populate: {
                avatar: {
                  fields: ["url"],
                },
                currency: {
                  fields: ["name", "symbol", "isoCode"],
                },
              },
            },
            category: {
              fields: ["title"],
            },
            banners: {
              fields: ["url"],
            },
            orders: {
              fields: ["id"],
            },
          },
          ...(limit && { limit: limit ?? 8 }),
        });

        const res = activeGigs?.filter((data) => {
          if (parseInt(ordersInProgress) > 0) {
            if (data?.orders?.length <= ordersInProgress) {
              return data;
            }
          } else {
            return data;
          }
        });

        ctx.body = res;
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  viewGigInfo: async (ctx) => {
    try {
      const { id } = ctx.params;

      const result = await strapi.entityService.findOne(
        "api::gig.gig",
        parseInt(id),
        {
          fields: [
            "id",
            "title",
            "overview",
            "description",
            "revisions",
            "deliveryDays",
            "minPrice",
            "maxPrice",
            "fixedPrice",
            "hourlyPrice",
            "pricingTable",
            "pricingModel",
            "faqs",
            "viewsCount",
          ],
          populate: {
            seller: {
              fields: ["displayName", "username", "createdAt", "country"],
              populate: {
                avatar: {
                  fields: ["url"],
                },
                currency: {
                  fields: ["name", "symbol", "isoCode"],
                },
              },
            },
            banners: {
              fields: ["url"],
            },
            attachments: {
              fields: ["url"],
            },
            orders: {
              filters: {
                status: "finished",
              },
              fields: ["stars", "review", "finishedAt"],
              populate: {
                buyer: {
                  fields: ["displayName", "country"],
                  populate: {
                    avatar: {
                      fields: ["url"],
                    },
                  },
                },
              },
            },
            views: {
              fields: ["views"],
            },
            category: {
              fields: ["title"],
            },
            subCategory: {
              fields: ["title"],
            },
          },
        }
      );

      const gig = {
        ...result,
        views: result?.viewsCount,
      };

      if (!ctx.state.user?.id) {
        ctx.body = gig;
        return;
      }

      const res = await strapi
        .service("api::gig-view.gig-view")
        .incrementView(ctx.state?.user?.id, id);

      console.log(res);

      ctx.body = gig;
    } catch (error) {
      ctx.body = error;
    }
  },
  previewGig: async (ctx) => {
    try {
      const { user } = ctx.state;
      const { id } = ctx.params;

      if (!user) {
        ctx.unauthorized({
          message: "You are not allowed to access this resource",
        });
        return;
      }

      const result = await strapi.entityService.findOne(
        "api::gig.gig",
        parseInt(id),
        {
          fields: [
            "id",
            "title",
            "overview",
            "description",
            "revisions",
            "deliveryDays",
            "views",
            "startingPrice",
            "fixedPrice",
            "hourlyPrice",
            "pricingTable",
            "pricingModel",
            "faqs",
          ],
          populate: {
            seller: {
              fields: ["displayName", "username", "createdAt", "country"],
              populate: {
                avatar: {
                  fields: ["url"],
                },
                currency: {
                  fields: ["name", "symbol", "isoCode"],
                },
              },
            },
            banners: {
              fields: ["url"],
            },
            attachments: {
              fields: ["url"],
            },
            orders: {
              filters: {
                status: "finished",
              },
              fields: ["stars", "review", "finishedAt"],
              populate: {
                buyer: {
                  fields: ["displayName", "country"],
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

      if (result?.seller?.id != user?.id) {
        ctx.unauthorized({
          message: "You are not allowed to access this resource",
        });
        return;
      }

      ctx.body = result;
    } catch (error) {
      ctx.body = error;
    }
  },
  myGigs: async (ctx) => {
    try {
      const { user } = ctx.state;
      const { status } = ctx.query;

      if (!user) {
        ctx.unauthorized("You are not allowed to access this resource");
        return;
      }

      const res = await strapi.entityService.findMany("api::gig.gig", {
        fields: [
          "id",
          "title",
          "revisions",
          "deliveryDays",
          "minPrice",
          "maxPrice",
          "fixedPrice",
          "hourlyPrice",
          "pricingModel",
          "viewsCount",
          "isActive",
          "status",
          "adminRemarks",
        ],
        filters: {
          $and: [
            { seller: user.id },
            {
              status: {
                $not: "deleted",
              },
            },
            ...(status != "all" ? [{ status }] : []),
          ],
        },
        populate: {
          orders: {
            fields: ["amount"],
          },
          banners: {
            fields: ["url"],
          },
          seller: {
            fields: ["id"],
            populate: {
              currency: {
                fields: ["symbol", "isoCode"],
              },
            },
          },
        },
      });

      const gigs = res?.map((gig) => ({
        ...gig,
        orders: gig?.orders?.length,
        ...(gig?.banners?.length && { banner: gig?.banners[0]?.url }),
        currency: gig?.seller?.currency?.symbol,
      }));

      ctx.body = gigs;
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  updateGig: async (ctx, next) => {
    try {
      const { id } = ctx.params;

      console.log(id);

      const existingGig = await strapi.entityService.findMany("api::gig.gig", {
        filters: {
          $and: [
            {
              seller: {
                id: ctx.state.user?.id,
              },
            },
            {
              id: id,
            },
          ],
        },
      });

      if (existingGig?.length) {
        const res = await strapi.entityService.update(
          "api::gig.gig",
          parseInt(id),
          {
            data: {
              ...ctx.request.body,
            },
          }
        );
        ctx.body = res;
      } else {
        ctx.unauthorized("You are not authorised to update this Gig");
      }
    } catch (error) {
      ctx.internalServerError = error;
    }
  },
  sellerGigs: async (ctx, next) => {
    try {
      const { sellerId, limit } = ctx.request.query;

      const res = await strapi.entityService.findMany("api::gig.gig", {
        fields: [
          "title",
          "minPrice",
          "maxPrice",
          "fixedPrice",
          "hourlyPrice",
          "overview",
          "title",
        ],
        filters: {
          $and: [
            {
              seller: sellerId,
            },
            {
              status: "active",
            },
            {
              isActive: true,
            },
          ],
        },
        populate: {
          banners: {
            fields: ["url"],
          },
          seller: {
            fields: ["displayName", "username"],
            populate: {
              avatar: {
                fields: ["url"],
              },
            },
          },
        },
        limit: limit ?? 8,
      });

      ctx.body = res;
    } catch (error) {
      ctx.internalServerError(error?.message);
    }
  },
}));
