const routes = require('./content-migration')
module.exports = {
  type: 'admin',
  routes: [...routes]
}