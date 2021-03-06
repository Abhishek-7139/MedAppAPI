"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  token(ctx) {
    try {
      const room = ctx.request.body.room;
      // Used when generating any kind of Access Token
      const twilioAccountSid = "SKc3525e2d755ab703560327f21d09286f";
      const twilioApiKey = "eELk8yELWkTLBBhvFpc37U9jRTK1hwxxNs89292Y";
      const twilioApiSecret = "WkwzdeKhTNIDEmRE1DkOIfEgeCwTkXJs";

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
      const videoGrant = new VideoGrant({
        room: room,
      });

      // Add the grant to the token
      token.addGrant(videoGrant);

      // Serialize the token to a JWT string
      const tokenString = token.toJwt();
      console.log(tokenString);

      //Email the patient the room name.
      return { token: tokenString, room: room };
    } catch (e) {
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  },
};
