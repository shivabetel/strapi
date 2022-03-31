'use strict';

/**
 * files-migration service.
 */

module.exports = {
    syncFiles: async (entities = []) => {


        try {
            const _promises = entities.map(file => new Promise(async (resolve, reject) => {
                const fileContent = await strapi.entityService.findOne('plugin::upload.file', file['id']).catch(error => reject(error))
                !fileContent ? strapi.entityService.create('plugin::upload.file', { data: file }).then(resolve).catch(error => reject(error)) : resolve();
            }))
            await Promise.all(_promises);

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }

    }
}
