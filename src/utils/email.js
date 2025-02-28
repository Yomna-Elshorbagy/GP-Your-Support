import nodemailer from "nodemailer";
import { emailtemplet } from "./email-templet.js";
import { generateToken } from "./token.js";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDEMAIL,
    pass: process.env.SENDEMAILPASSWORD,
  },
});

export const sendEmail = async (_id , email, otpCode ) => {
  const token = await generateToken({ payload: { _id, email }, secretKey: process.env.EMAIL_KEY });

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: `"project 👻" <${process.env.SENDEMAIL}>`, // sender address
        to: email, // list of receivers
        subject: "Confirm Email", // Subject line
        text: `Your OTP code is ${otpCode}`, // plain text body
        html: emailtemplet(token, otpCode), // html body
      });

      console.log("Message sent: %s", info.messageId);
  }


export async function sendResetPasswordMail( email, otpCode) {
  const info = await transporter.sendMail({
      from: `"project 👻" <${process.env.SENDEMAIL}>`,
      to: email,
      subject: "Reset Password ✔",
      text: "Hello ?",
      html: `<p>Hi, your verification code is: ${otpCode}</p>`,
  });
  console.log("Message sent:", info.messageId);
}
