const stripe = require('stripe'); // Stripe library
const StripconfigModel = require('../models/Stripconfig.model');
// const StripconfigModel = require('../models/Stripconfig.model');

let stripeInstance = null;
let stripeInitializationPromise = null;

// Initialize Stripe with dynamic secretKey
const initializeStripe = async () => {
  try {
    const config = await StripconfigModel.findOne();
    const secretKey = config ? config.secretKey : process.env.STRIPE_SECRET_KEY;


    if (!secretKey) {
      throw new Error('Stripe secret key not found in the database or .env file.');
    }

    stripeInstance = stripe(secretKey);

  } catch (error) {
    console.error('Error initializing Stripe:', error.message);
    throw error;
  }
};

// Create a Promise to ensure initialization completes
stripeInitializationPromise = initializeStripe();

// Export a function to get the initialized Stripe instance
const getStripe = async () => {
  if (!stripeInstance) {
    await stripeInitializationPromise; // Wait for initialization to complete
  }
  if (!stripeInstance) {
    throw new Error('Stripe is not initialized.');
  }
  return stripeInstance;
};

module.exports = {
  getStripe,
};
