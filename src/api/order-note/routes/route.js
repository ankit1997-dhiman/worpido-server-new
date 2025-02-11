module.exports = {
  routes: [
    {
      method: "POST",
      path: "/add-order-note",
      handler: "order-note.addNotes",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/get-order-note/:id",
      handler: "order-note.getNotes",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
