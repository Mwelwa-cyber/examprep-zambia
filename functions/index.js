const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

exports.setUserRole = functions.auth.user().onCreate(async (user) => {
  let role = "student";

  if (user.email === "youremail@gmail.com") {
    role = "admin";
  }

  await admin.auth().setCustomUserClaims(user.uid, { role });

  return null;
});