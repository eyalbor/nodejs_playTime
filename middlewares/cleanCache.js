const { clearHash } = require('../services/cache');

module.exports = async(req,res,next) => {
    await next();
    // route handler will do everything need to do
    clearHash(req.user.id);
}