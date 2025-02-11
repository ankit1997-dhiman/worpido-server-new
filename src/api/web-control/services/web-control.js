'use strict';

/**
 * web-control service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::web-control.web-control');
