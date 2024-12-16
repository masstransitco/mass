// src/services/sumsub.js

import axios from "axios";

const SUMSUB_API_URL = "https://api.sumsub.com"; // Replace with actual endpoint
const SUMSUB_API_TOKEN = "YOUR_SUMSUB_API_TOKEN";

export const createApplicant = async (externalUserId, email) => {
  try {
    const response = await axios.post(
      `${SUMSUB_API_URL}/resources/applicants`,
      {
        externalUserId,
        email,
      },
      {
        headers: {
          Authorization: `Bearer ${SUMSUB_API_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Sumsub Create Applicant Error:", error);
    throw error;
  }
};

export const getVerificationStatus = async (applicantId) => {
  try {
    const response = await axios.get(
      `${SUMSUB_API_URL}/resources/applicants/${applicantId}/check`,
      {
        headers: {
          Authorization: `Bearer ${SUMSUB_API_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Sumsub Get Verification Status Error:", error);
    throw error;
  }
};
