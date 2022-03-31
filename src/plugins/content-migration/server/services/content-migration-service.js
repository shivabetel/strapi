'use strict';


const _ = require('lodash');
const { ContentMigrationError } = require('../utils');
const { setupBegin } = require('./utils');
const { ValidationError, ApplicationError } = require('@strapi/utils').errors;




module.exports = ({ strapi }) => ({
  setup: async ({ modelId, targetEnv = '' }) => {

    try {

      return setupBegin(modelId, targetEnv)


    } catch (err) {
      return Promise.reject(err)
    }


    //return contentMigration.setup({modelId, targetEnv})
  },

  setupSingleType: async ({ modelId, entity }) => {

    try {
      if(!entity){
        throw new ContentMigrationError('Invalid input - entity is required')
      }
      if(!modelId){
        throw new ContentMigrationError('Invalid input - modelId is required')
      }

      const result = await strapi.entityService.findMany(modelId);
      const _promise =  result ? strapi.entityService.update(modelId, result['id'], { data: entity }) : strapi.entityService.create(modelId, { data: entity })
      const response = await _promise
      return Promise.resolve(response);



    } catch (err) {
      // if(err instanceof ValidationError || err instanceof ApplicationError){
      //   return Promise.reject(err['details']) 
      // }
      return Promise.reject(err['message'] || 'something went wrong')
    }


    //return contentMigration.setup({modelId, targetEnv})
  }
});
