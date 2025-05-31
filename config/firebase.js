const admin = require('firebase-admin');
const serviceAccount = require("../config/firebase-adminsdk");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;