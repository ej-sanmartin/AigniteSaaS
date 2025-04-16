const validateMailgunConfig = () => {
  const requiredFields = [
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN',
    'MAILGUN_FROM_EMAIL',
    'MAILGUN_FROM_NAME'
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Mailgun configuration: ${missingFields.join(', ')}`);
  }
};

// Validate configuration on module load
validateMailgunConfig();

export default {
  mailgunConfig: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    fromEmail: process.env.MAILGUN_FROM_EMAIL,
    fromName: process.env.MAILGUN_FROM_NAME
  }
};
