const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0/542227575631617/messages';
const WHATSAPP_ACCESS_TOKEN = 'EAAQzFQxG0goBO4DZABL7PrPyIdmFxDbP3hFYQCiioiJZAo4P4JbABnGw1qmBzVJUerTHkZB2qZAfWdaos16NJUYmXIewPTmV90neQjceLWnycrhZBfayZAP5EHCYD4qwBDNAiMvdBz8gLj6pwjDCCCVVA2UasKMPgvFx5GGwXfIMBBCc0tOvOCvTc6VeNkgD5GyAZDZD';

const sendWhatsAppWithFlow = async (recipientNumber) => {
  try {
    console.log('🚀 Sending WhatsApp message...');
    
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: recipientNumber,
        type: 'template',
        template: {
          name: 'verification',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'Freedom Ultra' },  // {{1}}
                { type: 'text', text: '120' },             // {{2}}
                { type: 'text', text: '50' },              // {{3}}
                { type: 'text', text: '500' },             // {{4}}
                { type: 'text', text: '2' },               // {{5}}
              ],
            },
            {
              type: 'button',
              sub_type: 'flow',
              index: 0
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error sending message:');
    if (error.response) {
      console.error('📌 Status:', error.response.status);
      console.error('📌 Response Data:', JSON.stringify(error.response.data, null, 2));
      return { success: false, error: error.response.data };
    } else if (error.request) {
      console.error('📌 No response received:', error.request);
      return { success: false, error: 'No response received' };
    } else {
      console.error('📌 Error:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// API endpoint to send WhatsApp message
app.post('/send-message', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }
  const result = await sendWhatsAppWithFlow(phoneNumber);
  res.json(result);
});

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Webhook endpoint to receive flow responses
app.post('/webhook', (req, res) => {
  console.log('📥 Received webhook data:', JSON.stringify(req.body, null, 2));
  
  if (req.body.entry && 
      req.body.entry[0].changes && 
      req.body.entry[0].changes[0].value.messages && 
      req.body.entry[0].changes[0].value.messages[0].interactive) {
    
    const flowResponse = req.body.entry[0].changes[0].value.messages[0].interactive;
    console.log('🔍 Flow Response Data:', JSON.stringify(flowResponse, null, 2));
  }

  res.status(200).send('OK');
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = "your_verify_token";

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});