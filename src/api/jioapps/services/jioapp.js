'use strict';

const { createCoreService } = require("@strapi/strapi/lib/factories");

/**
 * jioapps service.
 */

 module.exports = createCoreService('api::jioapps.jioapp');

// module.exports = createCoreService('api::jioapps.jioapp', ({ strapi }) => ({
//     setup: async (...args) => {
//         let response = { okay: true }

//         if (response.okay === false) {
//             return { response, error: true }
//         }

//         return response
//     }
// }))
