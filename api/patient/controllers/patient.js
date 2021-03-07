const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
("use strict");
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  token(ctx) {
    try {
      const room = ctx.request.body.room;
      if (!room) {
        ctx.send({ message: "mention the name of the room" }, 400);
      }
      // Used when generating any kind of Access Token
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioApiKey = process.env.TWILIO_API_SID;
      const twilioApiSecret = process.env.TWILIO_API_SECRET;

      // Create an access token which we will sign and return to the client,
      // containing the grant we just created
      const token = new AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret
      );
      token.identity = "Patient";

      // Create a Video grant which enables a client to use Video
      // and limits access to the specified Room
      const videoGrant = new VideoGrant({
        room: room,
      });

      // Add the grant to the token
      token.addGrant(videoGrant);

      // Serialize the token to a JWT string
      const tokenString = token.toJwt();
      // console.log(tokenString);

      return { token: tokenString };
    } catch (e) {
      console.log(e);
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  },

  async createPatient(ctx) {
    try {
      const doctorId = ctx.state.user.userObject[0].doctor.id;
      let entity;
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);
        entity = await strapi.services.patient.create(
          { ...data, doctors: [doctorId] },
          { files }
        );
      } else {
        entity = await strapi.services.patient.create({
          ...ctx.request.body,
          doctors: [doctorId],
        });
      }
      return sanitizeEntity(entity, { model: strapi.models.patient });
    } catch (error) {
      if (error.message === "Duplicate entry") {
        ctx.status = 400;
        ctx.body = {
          fieldErrors: true,
          fields: {
            email: "duplicate email exists",
          },
        };
        return;
      }
      ctx.status = 500;
    }
  },
};
