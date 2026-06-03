import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Email Configuration Test ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function runTest() {
    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP connection is successful!');

        const mailOptions = {
            from: `"MindWell Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self for test
            subject: 'MindWell - SMTP Connection Test',
            text: 'This is a test email from the MindWell AI Therapist server to confirm SMTP is working.'
        };

        console.log('Sending test email to self...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Email test failed!');
        console.error('Error details:', error);
    }
}

runTest();
