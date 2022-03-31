module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/files-migration',
     handler: 'files-migration.setup',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
