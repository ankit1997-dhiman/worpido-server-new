'use strict';

/**
 * web-control router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::web-control.web-control');
