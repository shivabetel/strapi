'use strict';

/**
 * migrationjob service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::migrationjob.migrationjob');
