const routes = require('./content-migration')
module.exports = {
  type: 'content-api',
  routes: [...routes]
}