module.exports = {
  async afterUpdate(event) {
    const { result, params } = event;

    if (params.data.stars > 3) {
      const existingGig = await strapi.entityService.findOne(
        "api::gig.gig",
        params.data?.gig?.id,
        {
          fields: ["id", "positiveReviews"],
        }
      );
      console.log(existingGig);

      if (!existingGig?.id) return;
      await strapi.entityService.update("api::gig.gig", params.data?.gig?.id, {
        data: {
          positiveReviews: existingGig?.positiveReviews + 1,
        },
      });
      return true;
    }
  },
};
