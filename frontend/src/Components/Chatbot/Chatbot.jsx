import React from 'react';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import './Chatbot.css';
const Chatbot = () => {
  const theme = {
    background: '#f5f8fb',
    fontFamily: 'Arial',
    headerBgColor: '#6366f1', // Indigo color
    headerFontColor: '#fff',
    headerFontSize: '18px',
    botBubbleColor: '#6366f1',
    botFontColor: '#fff',
    userBubbleColor: '#fff',
    userFontColor: '#4a4a4a',
  };

  const steps = [
    {
      id: '1',
      message: '👋 Hello! Welcome to Gr10 Store Support.',
      trigger: '2',
    },
    {
      id: '2',
      message: 'How can we assist you today?',
      trigger: 'mainOptions',
    },
    {
      id: 'mainOptions',
      options: [
        { value: 'order', label: '🛒 Order Related', trigger: 'orderOptions' },
        { value: 'payment', label: '💳 Payment Issue', trigger: 'paymentOptions' },
        { value: 'product', label: '🎁 Product Information', trigger: 'productOptions' },
        { value: 'other', label: '📩 Contact Support', trigger: 'contactSupport' },
      ],
    },
    // --- Order Related ---
    {
      id: 'orderOptions',
      options: [
        { value: 'track', label: '🔍 Track My Order', trigger: 'trackOrder' },
        { value: 'cancel', label: '❌ Cancel My Order', trigger: 'cancelOrder' },
        { value: 'back', label: '⬅️ Go Back', trigger: 'mainOptions' },
      ],
    },
    {
      id: 'trackOrder',
      message: '🛒 You can track your order in Dashboard → Order History after logging in.',
      trigger: 'anythingElse',
    },
    {
      id: 'cancelOrder',
      message: '❗ If you want to cancel your order, please email greeshdahal432@gmail with your Order ID.',
      trigger: 'anythingElse',
    },
    // --- Payment Related ---
    {
      id: 'paymentOptions',
      options: [
        { value: 'failed', label: '💥 Payment Failed', trigger: 'paymentFailed' },
        { value: 'notReceived', label: '⏳ Payment Done, Not Received', trigger: 'paymentNotReceived' },
        { value: 'back', label: '⬅️ Go Back', trigger: 'mainOptions' },
      ],
    },
    {
      id: 'paymentFailed',
      message: '💳 Payment failures can happen due to Khalti Api issues, Check your network. Please retry after some time.',
      trigger: 'anythingElse',
    },
    {
      id: 'paymentNotReceived',
      message: '⏳ If you have paid but not received, please wait 1-2 hour and refresh Order History.',
      trigger: 'anythingElse',
    },
    // --- Product Information ---
    {
      id: 'productOptions',
      options: [
        { value: 'code', label: '🧩 How do I get product code?', trigger: 'productCodeInfo' },
        { value: 'use', label: '🕹️ How to use Gift Card?', trigger: 'useGiftCard' },
        { value: 'back', label: '⬅️ Go Back', trigger: 'mainOptions' },
      ],
    },
    {
      id: 'productCodeInfo',
      message: '📩 You will receive your product code via email after order is confirmed and marked Delivered!',
      trigger: 'anythingElse',
    },
    {
      id: 'useGiftCard',
      message: '🎮 Simply redeem the Gift Card by entering the code in your game or platform!',
      trigger: 'anythingElse',
    },
    // --- Contact Support ---
    {
      id: 'contactSupport',
      message: '📩 For any help, please email: greeshdahal432@gmail or WhatsApp us!',
      trigger: 'anythingElse',
    },
    // --- Anything Else ---
    {
      id: 'anythingElse',
      message: '💬 Do you need anything else?',
      trigger: 'finalOptions',
    },
    {
      id: 'finalOptions',
      options: [
        { value: 'yes', label: '🔁 Yes, show options', trigger: 'mainOptions' },
        { value: 'no', label: '👋 No, thanks', trigger: 'goodbye' },
      ],
    },
    {
      id: 'goodbye',
      message: '🙏 Thank you for contacting Gr10 Store. Have a great day!',
      end: true,
    },
  ];
  
  return (
    <ThemeProvider theme={theme}>
      <ChatBot
        steps={steps}
        floating={true}
        headerTitle="Gr10 Support"
      />
    </ThemeProvider>
  );
};

export default Chatbot;
