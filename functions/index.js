const functions = require('firebase-functions');
const app = require('../backend/src/server');

// Export the Express app as an HTTP Cloud Function named "api"
exports.api = functions.https.onRequest(app);
