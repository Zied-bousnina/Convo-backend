
const nodemailer = require("nodemailer");
exports.generateOTP = () => {
  let otp = "";
  for (let i = 0; i <= 3; i++) {
    otp += Math.floor(Math.random() * 9);
  }
  return otp;
};
exports.generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_';
  let randomPassword = '';

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPassword += chars.charAt(randomIndex);
  }

  return randomPassword;
};
exports.mailTransport =()=>
    nodemailer.createTransport({
        host: process.env.HOST,
        port: process.env.PORT_MAILTRAP,
        auth: {
          user: process.env.MAILTRAP_USERNAME,
          pass: process.env.MAILTRAP_PASSWORD
        }
      });

      exports.generateEmailTemplate = code=> {
        return `
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
          <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
            <img src="./logo.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
            <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Welcome to Convoyage</h2>
            <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Please use the following code to verify your email.</p>
            <div style="background-color: #333; color: #fff; font-size: 20px; font-weight: 500; padding: 10px 20px; border-radius: 5px; display: inline-block;">
              ${code}
            </div>
          </div>
        </div>
      `;
        };
        exports.generateEmailTemplateDeleterAccount = code=> {
          return `
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
          <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Welcome to Convoyage</h2>
            <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Please use the following code to Delete you're account.</p>
            <div style="background-color: #333; color: #fff; font-size: 20px; font-weight: 500; padding: 10px 20px; border-radius: 5px; display: inline-block;">
              ${code}
            </div>
          </div>

          </div>
          `;
          };

          exports.generateEmailTemplatePartner = (name, businessName, email, password) => {
            return `
              <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
                <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                  <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
                  <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Welcome to Convoyage, ${name}!</h2>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Your account as a partner for ${businessName} has been created.</p>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Here is your generated password:</p>
                  <div style="background-color: #333; color: #fff; font-size: 20px; font-weight: 500; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    ${password}
                  </div>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Your registered email address: ${email}</p>
                </div>
              </div>
            `;
          };
          // Template for notifying the partner about the approval
  exports.generateEmailTemplatePartnerApproval = (partnerName,companyName, montant, startingPoint, destination) => {
  return `
    <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
      <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
        <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
        <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Mission Approved!</h2>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Dear ${partnerName},</p>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Your mission for<strong> ${companyName} </strong>has been approved. Please log in to your account to review the details.</p>
        <ul>
          <li><strong>Montant:</strong> ${Number(montant).toLocaleString('fr-FR', {style:'currency', currency: 'EUR'})}  </li>
          <li><strong>Starting Point:</strong> ${startingPoint}</li>
          <li><strong>Destination:</strong> ${destination}</li>
        </ul>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Thank you for using our system!</p>
      </div>
    </div>
  `;
};
exports.generateEmailTemplateMissionDelayed = (driverName, startingPoint, destination) => {
  return `
    <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
      <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
        <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
        <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Mission Delayed Notification</h2>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Dear ${driverName},</p>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">This is a notification to inform you that the mission has been delayed.</p>
        <ul>
          <li><strong>Starting Point:</strong> ${startingPoint}</li>
          <li><strong>Destination:</strong> ${destination}</li>
        </ul>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Please be aware that this notification is sent 24 hours after you accepted the mission.</p>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Thank you for your understanding!</p>
      </div>
    </div>
  `;
};


          exports.generateEmailTemplateAffectation = (driverName, missionDetails) => {
            const { postalAddress, postalDestination, dateDepart } = missionDetails;
            return `
              <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
                <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                  <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
                  <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Mission Affectation for ${driverName}!</h2>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">You have been assigned a new mission:</p>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Postal Address: ${postalAddress}</li>
                    <li style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Postal Destination: ${postalDestination}</li>
                    <li style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Date Departure: ${dateDepart}</li>
                  </ul>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Thank you for being part of Convoyage!</p>
                </div>
              </div>
            `;
          };

          exports.generateEmailTemplateDriver = (name, email, password) => {
            return `
              <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
                <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                  <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
                  <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Welcome to Convoyage, ${name}!</h2>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Your account as a Driver for ${name} has been created.</p>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Here is your generated password:</p>
                  <div style="background-color: #333; color: #fff; font-size: 20px; font-weight: 500; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                    ${password}
                  </div>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Your registered email address: ${email}</p>
                </div>
              </div>
            `;
          };
          exports.generateDeleteAccountEmailTemplate = (name, email) => {
            return `
              <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
                <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                  <img src="https://res.cloudinary.com/dcuafrhwc/image/upload/v1706050823/bddojqjjdmmgki8exnou.png" alt="Convoyage Logo" style="max-width: 100px; margin: 0 auto;">
                  <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Account Deleted from Convoyage, ${name}!</h2>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Your account has been deleted by an admin.</p>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">If you have any questions, please contact support.</p>
                  <p style="color: #333; font-size: 16px; font-weight: 400; margin: 10px 0 0;">Your registered email address: ${email}</p>
                </div>
              </div>
            `;
          };

exports.plainEmailTemplate = (heading, message) => {
    return `
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
        <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">${heading}</h2>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">${message}</p>
        </div>

        </div>
        `;
}

exports.generatePasswordResetTemplate = url => {
    return `
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center;">
        <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; font-size: 24px; font-weight: 500; margin: 0 0 10px;">Reset your password</h2>
        <p style="color: #333; font-size: 16px; font-weight: 400; margin: 0 0 10px;">Please click the following link to reset your password.</p>
        <div style="background-color: #333; color: #fff; font-size: 20px; font-weight: 500; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            <a href="${url}" style="color: #fff; text-decoration: none;">Reset Password</a>
        </div>
        </div>

        </div>
        `;

}





