const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.text({ type: 'text/plain' })); // Parse plain text
app.use(bodyParser.json()); // Parse JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data

// QR Formatting Endpoint
app.post('/format-qr', async (req, res) => {
  try {
    console.log('Request Headers:', req.headers);
    console.log('Raw Request Body:', req.body);

    let qrtext = req.body;

    // Ensure qrtext is a string
    if (typeof qrtext !== 'string') {
      qrtext = JSON.stringify(qrtext, null, 2);
    }

    const apiKey = process.env.OPENAI_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // Updated prompt for mobile contacts
    const prompt = `
Format the following data into a structured JSON format suitable for storing as a mobile contact. Include only fields that have values. Do not include fields with missing or empty data. The structure should include the following fields:

- name: Full name of the contact.
- organization: Name of the company or organization.
- phone: An object containing:
  - mobile: Mobile phone number.
  - office: Office phone number.
- email: Email address of the contact.
- address: Full address of the contact in a single string.
- jobTitle: Job title of the contact.

Ensure the JSON is clean and free of additional formatting, unnecessary quotes, or text. Do not include fields if they are empty or null. Example output format:

{
  "name": "John Doe",
  "organization": "Example Company",
  "phone": {
    "mobile": "+1234567890",
    "office": "+0987654321"
  },
  "email": "johndoe@example.com",
  "address": "123 Main St, City, State, ZIP",
  "jobTitle": "Software Engineer"
}

Input:
${qrtext}
`;


    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });

    const formattedData = response.data.choices[0].message.content;
    console.log('Formatted Data:', formattedData);

    res.json({ formattedData });
  } catch (error) {
    console.error('Error formatting QR text:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

module.exports = app; // Export app for Vercel