module.exports = {
  routes: [
    {
      method: "POST",
      path: "/gig",
      handler: "gig.create",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/gigs/view/:category",
      handler: "gig.viewActiveGigs",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/gigs/info/:id",
      handler: "gig.viewGigInfo",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/gigs/preview/:id",
      handler: "gig.previewGig",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/my-gigs",
      handler: "gig.myGigs",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/seller-gigs",
      handler: "gig.sellerGigs",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/update-gig/:id",
      handler: "gig.updateGig",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
