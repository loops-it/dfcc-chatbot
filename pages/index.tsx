import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import styles from '../styles/Home.module.css';
import LoadingIcons from 'react-loading-icons';
import { AiOutlineSend } from 'react-icons/ai';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';

// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';

export default function Home() {
  const router = useRouter();
  const [botAgentName, setBotAgentName] = useState('DFCC GPT')

  const handleButtonClick = () => {
    router.push({
      pathname: '/chatbot',
    });
  };


  return (
    <>
      <Head>
        <title>Financial Assistant</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossOrigin="anonymous"></link>
      </Head>
      <Script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossOrigin="anonymous"></Script>

      <main className={`${styles.mainContainer} container-fluid m-0 m-lg-2 p-0`}>
      <div className={`${styles.chatTopBar} d-flex flex-row `}>
        <div className="col-12 text-center d-flex flex-row justify-content-between px-2">
        <Image
                src="/chat-top-bar.png"
                alt="AI"
                width={150}
                height={30}
              />
        </div>
      </div>
        <div className={`${styles.chatContainer}  d-flex flex-column align-items-center text-center`}>
          {/* title */}
          <Image src={'/chat-header.png'} width={100} height={120} alt="chat header image" className={` mt-2`} />
          <Image src={'/chat-logo.png'} width={180} height={60} alt="chat header image" className={`${styles.welcomeImage} py-2`} />
          <p className={`mb-3 mt-2 ${styles.selectMethodtxt}`}>
            SELECT YOUR PREFERRED CHAT
          </p>
          {/* bot select card */}
          <div className='d-flex flex-column justify-content-center align-items-center'>
            <div className={`${styles.chatSelectBox}  col-12  p-3 d-flex flex-column align-items-center ${styles.boxColor1} me-lg-2 mb-2 mb-lg-0`}>
              <Link href={'/chatbot'} >
                <p className='text-dark text-uppercase mb-0'><strong>CONNECT WITH AI ASSISTANT</strong></p>
              </Link>
            </div>
            <div className={`${styles.chatSelectBox} col-12  p-3 d-flex flex-column align-items-center ${styles.boxColor2} me-lg-2 mb-2 mb-lg-0`}>
              <Link href={'/liveAgent'} >
                <p className='text-dark text-uppercase mb-0'><strong>CONNECT WITH A LIVE AGENT</strong></p>
              </Link>
            </div>
            
            {/* <div className={`${styles.chatSelectBox} col-12  p-3 d-flex flex-column align-items-center ${styles.boxColor3} me-lg-2 mb-2 mb-lg-0`}>
              <Link href={'/videobot'} >
                <p className='text-dark text-uppercase mb-0'><strong>CONNECT VIA VIDEO</strong></p>
              </Link>
            </div>
            
            <div className={`${styles.chatSelectBox} col-12  p-3 d-flex flex-column align-items-center ${styles.boxColor4} mb-2 mb-lg-0`}>
              <Link href={'/audiobot'} >
                <p className='text-dark text-uppercase mb-0'><strong>CONNECT VIA AUDIO</strong></p>
              </Link>
          </div> */}
          </div>

        </div>
      </main>
    </>
  );
}
