'use strict';

module.exports = {
 setup:  async function(ctx) {
    console.log("inside the content-migration plugin controller")
    const { request } = ctx;
    const { body } = request;
    const { modelId, targetEnv } = body;
    try {
      const response  = await strapi
        .plugin('content-migration')
        .service('contentMigrationService')
        .setup({ modelId, targetEnv })
        ctx.body = response;
    } catch (err) {
      ctx.throw(400, err)
    }
  },
  setupContentSingleType: async function(ctx) { 
    try{

      const { request } = ctx;
      const { body } = request;
      const { modelId, entity } = body;
      const resposne = await strapi
        .plugin('content-migration')
        .service('contentMigrationService')
        .setupSingleType({modelId, entity})
        ctx.body = resposne

    }catch(err){
      ctx.throw(400, err)
    }
  }
};
