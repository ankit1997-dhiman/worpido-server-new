"use strict";

/**
 * gig service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::gig.gig");
