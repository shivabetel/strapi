module.exports ={
    
    routes: [
        //...routes,
        {
            method: 'GET',
            path: '/jioapps/info',
            handler: 'jioapp.info',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/jioapps/setup',
            handler: 'jioapp.setup',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}