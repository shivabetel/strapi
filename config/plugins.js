module.exports = ({ env }) => {
  return {
    upload: {
      config: {
          provider: 'aws-s3',
          providerOptions: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_ACCESS_SECRET'),
              region: env('AWS_REGION'),
              params: {
                  Bucket: env('AWS_BUCKET_NAME'),
              },
          },
      },
  },  
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
