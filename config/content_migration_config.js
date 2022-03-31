module.exports = ({env}) => ({
    staging: {
        strapi: {
            basepath: 'http://127.0.0.1:1338',
            host: '127.0.0.1',
            port: 1338,
            apiToken: env('STAGING_CONTENT_MIGRATION_API_TOKEN')
        }
        
    }
})