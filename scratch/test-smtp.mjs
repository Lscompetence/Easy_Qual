import nodemailer from 'nodemailer'

async function testSmtp() {
    let transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "a8da5a001@smtp-brevo.com",
            pass: "xsmtpsib-7c3f0c62ff698a1c9f18f9e6609abcfc340f8851d596510d576539782b041a65-qv7Ir1gx8c2i7pTH"
        }
    });

    try {
        console.log("Testing SMTP connection...")
        let info = await transporter.sendMail({
            from: '"EasyQual" <devweb.lsc@outlook.com>',
            to: "devweb.lsc@outlook.com", 
            subject: "Test SMTP",
            text: "Hello world?",
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("SMTP Error:", error);
    }
}

testSmtp()
