'use strict';

const { syncFiles } = require("../services/files-migration");

/**
 * A set of functions called "actions" for `files-migration`
 */

module.exports = {
  setup: async (ctx, next) => {
    try {
      const { request } = ctx;
      const { body } = request;
      const { entities = [] } = body;
      await syncFiles(entities)
      ctx.body = 'ok';
    } catch (err) {
      ctx.throw(400, err)
    }
  }
};
