const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
("use strict");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  token(ctx) {
    try {
      const user = ctx.state.user;
      if (user && user.userType === "Doctor") {
        //send email to this
        const patientID = ctx.request.body.patientID;
        // Used when generating any kind of Access Token
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioApiKey = process.env.TWILIO_API_KEY;
        const twilioApiSecret = process.env.TWILIO_API_SECRET;

        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        const token = new AccessToken(
          twilioAccountSid,
          twilioApiKey,
          twilioApiSecret
        );
        token.identity = user.username;

        // Create a Video grant which enables a client to use Video
        // and limits access to the specified Room
        const room = `${ctx.user.username}-${patientID}-Session`;
        const videoGrant = new VideoGrant({
          room: room,
        });

        // Add the grant to the token
        token.addGrant(videoGrant);

        // Serialize the token to a JWT string
        const tokenString = token.toJwt();
        console.log(tokenString);

        return { token: tokenString };
      } else {
        ctx.send({ message: "Unauthorized" }, 403);
      }
    } catch (e) {
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  },
};
