module.exports = ({ env }) => {
  return {
    'content-migration': {
      enabled: true,
      resolve: './src/plugins/content-migration',
      config: {
        contentMigrationConfigFile: 'content_migration_config',//js file for content migration target configuration or the below configuration
        // staging: {
        //   strapi: {
        //     host: '127.0.0.1',
        //     port: 1338,
        //     apiToken: env['staging-api-token']
        //   }

        // }
      }
    }
  }
}