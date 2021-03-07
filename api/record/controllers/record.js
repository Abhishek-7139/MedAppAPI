"use strict";

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const nodemailer = require("nodemailer");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async make(ctx) {
    try {
      if (ctx.is("multipart")) {
        ctx.send({ message: "Bad Request" }, 400);
      } else {
        const doctorObject = ctx.state.user.userObject[0].doctor;
        const patient = ctx.request.body.patient;
        const description = ctx.request.body.description;
        const entity = await strapi.services.record.create({
          doctor: doctorObject.id,
          patient,
          description,
        });
        const record = sanitizeEntity(entity, { model: strapi.models.record });
        const patientObject = await strapi.services.patient.findOne({
          id: patient,
        });
        if (!patientObject) {
          ctx.send({ message: "Bad Request" }, 400);
        }
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS,
          },
        });
        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: patientObject.email,
          subject: `Doctors note of your session on ${record.createdAt.toString()}`,
          text: `Hello, ${patientObject.firstName} ${patientObject.lastName}!

${record.description}

- Dr. ${doctorObject.firstName} ${doctorObject.lastName}
Thank You!
`,
        };
        await transporter.sendMail(mailOptions);
        return record;
      }
    } catch (e) {
      console.log(e);
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  },
};
