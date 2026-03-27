const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // SECURITY BYPASSED: Login requirement completely disabled per user request
    req.user = { id: 1, username: 'admin' };
    next();
};
