var config = {};
config.loginUrl = 'http://xx-xx-xx-xx-xx.us-west-2.compute.amazonaws.com/';
config.tokenUrl = 'http://input.fitplanapp.com/fitplan-server/oauth/token';
config.apiUrl = 'http://input.fitplanapp.com/';
config.serverPath = 'fitplan-server/';
config.userAdminPath = 'fitplan-server/user-admin/';
config.planDetail = 'fitplan-server/subscription-reports/athlethe-program?id=1';
config.grant_type = 'password';
config.client_id = 'xx';
config.client_secret = 'xx';
config.sessionSecret = 'xx-xx';
config.maxAge =  60 * 60 * 1000; // 1 hour;
config.mongo =  'mongodb://localhost:27017/fitplanapp';
config.defaultUserConfig = {favUsers:10, reportPage:10, listUsers:10};


module.exports = config;
