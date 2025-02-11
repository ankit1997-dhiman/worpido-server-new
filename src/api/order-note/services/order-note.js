'use strict';

/**
 * order-note service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::order-note.order-note');
