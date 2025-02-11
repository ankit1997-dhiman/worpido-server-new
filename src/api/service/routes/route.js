module.exports = {
  routes: [
    {
      method: "GET",
      path: "/subcategory-services/:subcategory",
      handler: "service.subcategoryServices",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
