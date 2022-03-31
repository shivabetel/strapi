'use strict';


module.exports = [
    {
      method: 'POST',
      path: '/',
      handler: 'contentMigrationController.setup',
      config: {
        policies: [],
      },
    }
  ];
  

