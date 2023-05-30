import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import { BsFillMicMuteFill, BsFillMicFill } from 'react-icons/bs';
import { Document } from 'langchain/document';

const AudioBot = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about DFCC Bank?',
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });
  const { messages, pending, history, pendingSourceDocs } = messageState;
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [apiMessageFinal, setApiMessageFinal] = useState('');
  const [msgUpdated, setMsgUpdated] = useState(false);



  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  const [id, setId] = useState('');
  useEffect(() => {
    const now = Date.now();
    const newId = now.toString();
    setId("audio"+newId);
  }, []);

  useEffect(() => {
    
  }, [apiMessageFinal, messages]);



  // useEffect(() => {
  //   // get api message in to one state
  //   try {
  //     const latestApiMessage = messageState.messages.reduce((acc, message) => {
  //       if (message.type === 'apiMessage') {
  //         return message.message;
  //       }
  //       console.log('acc : ', acc)
  //       return acc;

  //     }, '');

  //     setApiMessageFinal(latestApiMessage);
  //     setMsgUpdated(true);
  //     console.log('apiMessageFinal : ', apiMessageFinal)
  //     if (msgUpdated === true) {
  //       console.log(" msgUpdated : ", msgUpdated);
  //       handleSpeak()
  //       // setTimeout(async ()=> {
  //       //         await handleVideo();
  //       //       },5000)
  //     }

  //   } catch (error) {
  //     console.error(error);
  //   }

  // }, [apiMessageFinal, msgUpdated]);

  // async function handleSpeak(){
    

  // }


  



  //handle form submission
  async function handleSubmit() {

    setError(null);
    setLoading(true);
    // const response = await fetch('https://solutions.it-marketing.website/recording-start', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     chatId: id,
    //     apiType: "audio",
    //   }),
    // });

    // if (response.status !== 200) {
    //   const error = await response.json();
    //   throw new Error(error.message);
    // }
    // const data = await response.json();

    const response = await fetch('/api/speech_recognition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
        chatId: id
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log("audiobot : ",data)


    if (data.status === "success") {
      const question = data;
      if (!question) {
        alert('Racording failed!');
        setLoading(false);
        return;
      }
  
      setMessageState((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            type: 'userMessage',
            message: question,
          },
        ],
        pending: undefined,
      }));
  
      setQuery('');
      setMessageState((state) => ({ ...state, pending: '' }));
  
      const ctrl = new AbortController();
  
      try {
        const response = await fetch('https://solutions.it-marketing.website/audio-chatGpt-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question,
            chatId: id,
          }),
        });
        if (response.status !== 200) {
          const error = await response.json();
          throw new Error(error.message);
        }
        const data = await response.json();
        setMessageState((state) => ({
          history: [...state.history, [question, state.pending ?? '']],
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.finalResponse,
              sourceDocs: state.pendingSourceDocs,
            },
          ],
          pending: undefined,
          pendingSourceDocs: undefined,
        }));
        setApiMessageFinal(data.finalResponse)
        // setMsgUpdated(false);
        setLoading(false);
  
      } catch (error) {
        setLoading(false);
        setError('An error occurred while fetching the data. Please try again.');
        console.log('error', error);
      }
    }
    
    
  }


  useEffect(() => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = apiMessageFinal;
    const voices = synth.getVoices();
    utterance.voice = voices[2];
    synth.speak(utterance);

  }, [apiMessageFinal]);

  function speakLastApiMessage(messages: string | any[]) {
    const lastApiMessage = messages[messages.length - 1];
    if (lastApiMessage?.type === 'apiMessage') {
      const synth = typeof window !== 'undefined' && window.speechSynthesis;
      if (synth) {
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = lastApiMessage.message;
        const voices = synth.getVoices();
        utterance.voice = voices[2];
        synth.speak(utterance);
      }
    }
  }

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
            {
              type: 'apiMessage',
              message: pending,
              sourceDocs: pendingSourceDocs,
            },
          ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);

  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <Layout>
      {/* chat top header */}
      <div className={`${styles.chatTopBar} d-flex flex-row`}>
        <div className="col-12 text-center d-flex flex-row justify-content-between px-2">
          <Image src="/chat-top-bar.png" alt="AI" width={150} height={30} />
        </div>
      </div>
      {/* chat message area */}
      <div className={`${styles.messageWrapper}`} style={{height: "74vh"}}>
        <div
          ref={messageListRef}
          className={`${styles.messageContentWrapper} d-flex flex-column`}
        >
          {chatMessages.map((message, index) => {
            let icon;
            let className;
            let userHomeStyles;
            let wrapper = 'align-items-end justify-content-end';
            let userStyles = 'justify-content-end flex-row-reverse float-end';
            console.log('message : => ', message.message);
            if (message.type === 'apiMessage') {
              icon = (
                <Image
                  src="/chat-header.png"
                  alt="AI"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              className = styles.apimessage;
              userStyles = 'justify-content-start flex-row float-start';
              wrapper = 'align-items-start justify-content-start';
            } else {
              icon = (
                <Image
                  src="/user.png"
                  alt="Me"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              userHomeStyles = styles.userApiStyles;
              // The latest message sent by the user will be animated while waiting for a response
              className =
                loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
            }
            return (
              <>
                <div
                  key={`chatMessage-${index}`}
                  className={styles.botMessageContainerWrapper}
                >
                  <div
                    className={`${styles.botChatMsgContainer} ${userStyles} d-flex my-2`}
                  >
                    <div className="d-flex">{icon}</div>
                    <div className={`${wrapper} d-flex flex-column ms-2`}>
                      <div
                        className={`${styles.botMessageContainer} ${userHomeStyles} d-flex flex-column my-1`}
                      >
                        <p className="mb-0">{message.message}</p>
                      </div>
                      {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
                    </div>
                  </div>
                </div>
              </>
            );
          })}
        </div>
      </div>

      {/* input fields =================*/}
      <div className={`${styles.inputContainer}`}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`${styles.inputIconContainer2} `}
        >
          {loading ? (
            <div className={styles.loadingwheel}>
              <BsFillMicFill className="sendIcon" />
            </div>
          ) : (
            <BsFillMicMuteFill className="sendIcon" />
          )}
        </button>
      </div>
      {error && (
        <div className="border border-red-400 rounded-md p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {/* input fields ================= */}
    </Layout>
  );
};

export default AudioBot;
