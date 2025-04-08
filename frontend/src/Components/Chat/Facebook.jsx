"use client"

import React from 'react'
import { FacebookProvider, CustomChat } from 'react-facebook';

const FacebookMsg = () => {
  return (
        <FacebookProvider appId="678079261420838" chatSupport>
         <CustomChat pageId="629504813576749" minimized={true}/>
        </FacebookProvider> 
  );
};

export default FacebookMsg;