module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '5cd795df67373bd03356e3c47d634c48'),
  },
});
