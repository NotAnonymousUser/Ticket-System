import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create a transporter using Gmail SMTP
const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log('Email Configuration in emailService.js:');
    console.log('- USER:', user ? user : 'Not set');
    console.log('- PASS:', pass ? 'Set' : 'Not set');

    if (!user || !pass) {
        console.warn('Email credentials not configured. Check EMAIL_USER and EMAIL_PASS in .env');
        return null;
    }

    // Remove any spaces from the password
    const cleanPass = pass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: user,
            pass: cleanPass
        },
        debug: true
    });

    // Verify the connection configuration
    transporter.verify(function(error, success) {
        if (error) {
            console.log('SMTP connection error:', error);
        } else {
            console.log('SMTP server is ready to take our messages');
        }
    });

    return transporter;
};

const transporter = createTransporter();

// Function to send email
const sendEmail = async (to, template) => {
    if (!transporter) {
        console.warn('Email service not configured. Skipping email send.');
        return;
    }

    try {
        const emailTo = Array.isArray(to) ? to.join(', ') : to;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailTo,
            subject: template.subject,
            text: template.text,
            html: template.html // Add HTML support
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Log more details about the error
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Check your Gmail credentials and app password.');
        }
    }
};

// Email templates
const getStatusColor = (status) => {
    const colors = {
        'Open': '#FCD34D',
        'In Progress': '#60A5FA',
        'Resolved': '#34D399',
        'Closed': '#9CA3AF'
    };
    return colors[status] || '#9CA3AF';
}

const getPriorityColor = (priority) => {
    const colors = {
        'High': '#EF4444',
        'Medium': '#F59E0B',
        'Low': '#10B981'
    };
    return colors[priority] || '#9CA3AF';
}

const baseEmailStyles = `  <style>
        body { 
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
    background-color: #1E40AF;
    color: white;
    padding: 20px;
    border-radius: 5px 5px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center; /* Vertically center align */
}

.header-left {
    /* Remove width calculation - let it grow naturally */
    text-align: center;
}

.header-right {
    text-align: right;
    /* Remove fixed width */
}.content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 5px 5px;
        }
        .ticket-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            margin-right: 10px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #1E40AF;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
        }
        .divider {
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }
        .update-message {
            background-color: #f0f9ff;
            border-left: 4px solid #1E40AF;
            padding: 15px;
            margin: 20px 0;
        }.badge-container {
        display: flex;
        gap: 20px;  /* Increase gap between badges */
        margin: 15px 0;
        align-items: center;  /* Align badges vertically */
        }.badge {
        padding: 8px 15px;  /* Increase padding for better visibility */
        border-radius: 4px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        }
    </style>
`;

const createTicketEmailTemplate = (ticket, creator) => {
    // Set default values for missing fields
    const status = ticket.status || 'New';
    const date = ticket.date ? new Date(ticket.date).toLocaleDateString() : new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseEmailStyles}
  </head>
    <body>
        <div class="container">
<div class="header">
    <div class="header-left">
        <h1>New Ticket Created</h1>
        <p>Ticket #${ticket.ticketCode}</p>
        <div class="created-info" style="display: flex; justify-content: space-between; align-items: center;">
            <p><strong>Created By:</strong> ${creator.username}</p>
            <p><strong>Created Date:</strong> ${date}</p>
        </div>
    </div>
</div>

            <div class="content">
                <p>Dear User,</p>
                
                <p>A new ticket has been created in the system. Here are the details:</p>
                
                <div class="ticket-info">
                    <h2 style="margin-top: 0;">${ticket.title}</h2>
                    <p>${ticket.description}</p>
                    
                    <div class="badge-container">
                        <span class="badge" style="background-color: ${getPriorityColor(ticket.priority)}"><strong>Priority: </strong>${ticket.priority}</span>
                    </div>
                    
                    <div class="divider"></div>
                    
                    
                </div>
                
                
            </div>
            
             <div class="footer">
                <p>This is an automated message from the Ticketing System.</p>
                <p>   &copy; ${new Date().getFullYear()} i-MSConsulting | All rights reserved. Designed by i-MSConsulting.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const updateTicketEmailTemplate = (ticket, user, action) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseEmailStyles}
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Ticket Updated</h1>
                <p>Ticket #${ticket.TicketCode}</p>
            </div>
            
            <div class="content">
                <p>Dear ${user.username},</p>
                
                <div class="update-message">
                    <p><strong>Update:</strong> Ticket has been ${action}</p>
                </div>
                
                <div class="ticket-info">
                    <h2 style="margin-top: 0;">${ticket.Title}</h2>
                    <p>${ticket.Description}</p>
                    
                    <div>
                        <span class="badge" style="background-color: ${getStatusColor(ticket.Status)}">${ticket.Status}</span>
                        <span class="badge" style="background-color: ${getPriorityColor(ticket.Priority)}">${ticket.Priority}</span>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p><strong>Created By:</strong> ${ticket.CreatedBy}</p>
                    <p><strong>Created Date:</strong> ${new Date(ticket.Date).toLocaleDateString()}</p>
                    ${ticket.AssignedTo ? `<p><strong>Assigned To:</strong> ${ticket.AssignedTo}</p>` : ''}
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3000/tickets/${ticket.TicketCode}" class="button">View Ticket</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated message from the Ticketing System.</p>
                <p>   &copy; ${new Date().getFullYear()} i-MSConsulting | All rights reserved. Designed by i-MSConsulting.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const emailTemplates = {
    ticketCreated: (ticket, creator) => ({
        subject: `New Ticket Created - ${ticket.TicketCode}`,
        text: `
            A new ticket has been created:
            Ticket Code: ${ticket.TicketCode}
            Title: ${ticket.Title}
            Description: ${ticket.Description}
            Priority: ${ticket.Priority}
            Created by: ${creator.username}
        `,
        html: createTicketEmailTemplate(ticket, creator)
    }),
    
    ticketAssigned: (ticket, assignee) => ({
        subject: `Ticket Assigned - ${ticket.TicketCode}`,
        text: `
            A ticket has been assigned to you:
            Ticket Code: ${ticket.TicketCode}
            Title: ${ticket.Title}
            Assigned to: ${assignee.username}
        `,
        html: updateTicketEmailTemplate(ticket, assignee, 'assigned')
    }),
    
    ticketResolved: (ticket, supportMember) => ({
        subject: `Ticket Resolved - ${ticket.TicketCode}`,
        text: `
            A ticket has been resolved:
            Ticket Code: ${ticket.TicketCode}
            Title: ${ticket.Title}
            Resolved by: ${supportMember.username}
        `,
        html: updateTicketEmailTemplate(ticket, supportMember, 'resolved')
    }),
    
    ticketClosed: (ticket) => ({
        subject: `Ticket Closed - ${ticket.TicketCode}`,
        text: `
            A ticket has been closed:
            Ticket Code: ${ticket.TicketCode}
            Title: ${ticket.Title}
        `,
        html: updateTicketEmailTemplate(ticket, null, 'closed')
    }),

    newComment: (ticket, commenter) => ({
        subject: `New Comment on Ticket - ${ticket.TicketCode}`,
        text: `
            A new comment has been added to the ticket:
            Ticket Code: ${ticket.TicketCode}
            Title: ${ticket.Title}
            Comment by: ${commenter.username}
            Comment: ${ticket.CommentText}
        `,
        html: updateTicketEmailTemplate(ticket, commenter, 'commented')
    })
};

// Notification functions
const sendTicketCreationNotification = async (ticket, creator) => {
    console.log('Sending ticket creation notification:', { ticket, creator });
    const template = emailTemplates.ticketCreated(ticket, creator);
    
    // Send to creator
    if (creator.email) {
        console.log('Sending to creator:', creator.email);
        await sendEmail(creator.email, template);
    } else {
        console.log('Creator email not provided');
    }
    
    // Send to admin
    if (process.env.ADMIN_EMAIL) {
        console.log('Sending to admin:', process.env.ADMIN_EMAIL);
        await sendEmail(process.env.ADMIN_EMAIL, template);
    } else {
        console.log('Admin email not configured');
    }
};

const sendTicketAssignmentNotification = async (ticket, assignee) => {
    console.log('Sending ticket assignment notification:', { ticket, assignee });
    const template = emailTemplates.ticketAssigned(ticket, assignee);
    
    // Send to assignee
    if (assignee.email) {
        console.log('Sending to assignee:', assignee.email);
        await sendEmail(assignee.email, template);
    }
    
    // Send to admin
    if (process.env.ADMIN_EMAIL) {
        console.log('Sending to admin:', process.env.ADMIN_EMAIL);
        await sendEmail(process.env.ADMIN_EMAIL, template);
    }
};

const sendTicketResolutionNotification = async (ticket, supportMember, creator) => {
    console.log('Sending ticket resolution notification:', { ticket, supportMember, creator });
    const template = emailTemplates.ticketResolved(ticket, supportMember);
    
    // Send to creator
    if (creator.email) {
        console.log('Sending to creator:', creator.email);
        await sendEmail(creator.email, template);
    }
    
    // Send to support member
    if (supportMember.email) {
        console.log('Sending to support member:', supportMember.email);
        await sendEmail(supportMember.email, template);
    }
    
    // Send to admin
    if (process.env.ADMIN_EMAIL) {
        console.log('Sending to admin:', process.env.ADMIN_EMAIL);
        await sendEmail(process.env.ADMIN_EMAIL, template);
    }
};

const sendTicketClosureNotification = async (ticket, supportMember, creator) => {
    console.log('Sending ticket closure notification:', { ticket, supportMember, creator });
    const template = emailTemplates.ticketClosed(ticket);
    
    // Send to creator
    if (creator.email) {
        console.log('Sending to creator:', creator.email);
        await sendEmail(creator.email, template);
    }
    
    // Send to support member
    if (supportMember.email) {
        console.log('Sending to support member:', supportMember.email);
        await sendEmail(supportMember.email, template);
    }
    
    // Send to admin
    if (process.env.ADMIN_EMAIL) {
        console.log('Sending to admin:', process.env.ADMIN_EMAIL);
        await sendEmail(process.env.ADMIN_EMAIL, template);
    }
};

const sendCommentNotification = async (ticket, commenter, recipientEmails) => {
    console.log('Sending comment notification:', { ticket, commenter, recipientEmails });
    const template = emailTemplates.newComment(ticket, commenter);
    
    // Send to all recipients
    for (const email of recipientEmails) {
        console.log('Sending to recipient:', email);
        await sendEmail(email, template);
    }
};

export {
    sendEmail,
    sendTicketCreationNotification,
    sendTicketAssignmentNotification,
    sendTicketResolutionNotification,
    sendTicketClosureNotification,
    sendCommentNotification,
    emailTemplates
};
