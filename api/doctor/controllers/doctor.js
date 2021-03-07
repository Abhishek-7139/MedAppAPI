const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const cryptoRandomString = require("crypto-random-string");
const userVideoPage = "https://med-app-nsut.netlify.app/connect/patient";
const nodemailer = require("nodemailer");

("use strict");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async token(ctx) {
    try {
      const user = ctx.state.user;
      if (user && user.userType === "Doctor") {
        //send email to this
        const patientID = ctx.request.body.patientID;
        if (!patientID) {
          ctx.send({ message: "mention the id of the patient" }, 400);
        }

        const patient = await strapi.services.patient.findOne({
          id: patientID,
        });
        if (!patient) {
          ctx.send({ message: "Patient Doesn't Exist" }, 400);
        }
        const doctorObject = user.userObject[0].doctor;

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
        token.identity = user.username;

        // Create a Video grant which enables a client to use Video
        // and limits access to the specified Room
        const random = cryptoRandomString({ length: 10, type: "url-safe" });
        const room = `${user.username}-${patientID}-${random}`;
        const videoGrant = new VideoGrant({
          room: room,
        });

        // Add the grant to the token
        token.addGrant(videoGrant);

        // Serialize the token to a JWT string
        const tokenString = token.toJwt();
        //Send this room name in the email to the user.
        //`<link of the page where the user will get into the video chat>?room=${room}`
        //the page will use this query param to send a join request to this room.

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS,
          },
        });
        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: patient.email,
          subject: "Link to join the online checkup session",
          text: `
Hello, ${patient.firstName} ${patient.lastName}!
Dr. ${doctorObject.firstName} ${doctorObject.lastName} is ready and waiting for your session.

Click on the following link to join the session:
${userVideoPage}/${room}
Thank You!
          `,
        };
        await transporter.sendMail(mailOptions);
        return { token: tokenString, room: room };
      } else {
        ctx.send({ message: "Unauthorized" }, 403);
      }
    } catch (e) {
      console.log(e);
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  },
};
