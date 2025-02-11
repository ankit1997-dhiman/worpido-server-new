module.exports = {
  routes: [
    {
      method: "GET",
      path: "/categories/view/all",
      handler: "category.getAllCategories",
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};
