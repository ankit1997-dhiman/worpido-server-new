module.exports = {
  async afterCreate(event) {
    try {
      const { result, params } = event;
      let maxPrice;
      let minPrice;

      if (result?.pricingModel == "plans") {
        let pricingKey;

        if (result?.pricingTable?.data?.hasOwnProperty("Pricing")) {
          pricingKey = "Pricing";
        } else if (result?.pricingTable?.data?.hasOwnProperty("Price")) {
          pricingKey = "Price";
        } else {
          throw new Error(
            `No valid Pricing or Price key found in the provided Pricing Table.`
          );
        }

        maxPrice = Math.max(...result?.pricingTable?.data[pricingKey]);
        minPrice = Math.min(...result?.pricingTable?.data[pricingKey]);

      }
      else if (result?.pricingModel == "hourly") {
        minPrice = result?.hourlyPrice
        maxPrice = result?.hourlyPrice
      }
      else if (result?.pricingModel == "fixed") {
        minPrice = result?.fixedPrice
        maxPrice = result?.fixedPrice
      }

      await strapi.entityService.update("api::gig.gig", result?.id, {
        data: {
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice),
        },
      });
      return true;
      
    } catch (error) {
      console.log("Error updating minprice maxprice");
      console.log(error);
      return true;
    }
  }
};
