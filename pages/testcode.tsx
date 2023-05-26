import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  AiOutlineSend,
  AiOutlineClose,
  AiFillStar,
  AiOutlineStar,
} from 'react-icons/ai';
import { Document } from 'langchain/document';
import LoadingIcons from 'react-loading-icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Chatbottest() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [apiMessageFinal, setApiMessageFinal] = useState('');

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
  const [selectedLanguage, setSelectedLanguage] = useState('ENGLISH');
  const [trMsg, setTrMsg] = useState('');
  const [id, setId] = useState('');

  useEffect(() => {
    const now = Date.now();
    const newId = now.toString();
    setId(newId);
  }, []);
  // console.log('user id : ',id)

  useEffect(() => {
    // console.log(selectedLanguage);
    // console.log('useEffect : ',apiMessageFinal)
  }, [selectedLanguage, apiMessageFinal]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  // console.log("outside handle translation : ",apiMessage);

  async function handleTranslation() {
    // if (!apiMessageFinal) {
    //   return;
    // }
    // setApiMessageFinal('');
    // console.log("inside handle translation : ",apiMessageFinal);
    // Translate the latest apiMessage to the selected language
    const response = await fetch(
      'http://localhost:5000/translate-to-language',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultMessage: apiMessageFinal,
          language: selectedLanguage,
          chatId: id,
        }),
      },
    );

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const botMessage = await response.json();
    const translatedMessage = botMessage.translations[0];
    // console.log("translatedMessage from api : ",translatedMessage)
    setTrMsg((prevApiMessage) => prevApiMessage + translatedMessage);
    return translatedMessage;
  }
  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }
    // get user message
    let question = query.trim();
    console.log('question from user : ', question);

    // set user message array
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

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    // translate to sinhala
    const response = await fetch('http://localhost:5000/translate-to-english', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_Message: question,
        language: selectedLanguage,
        chatId: id,
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const data = await response.json();
    question = data.translationsToEng[0];
    console.log('translated response : ', data.translationsToEng[0]);

    const ctrl = new AbortController();

    // send user message to api endpoint
    try {
      fetchEventSource('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
        signal: ctrl.signal,
        onmessage: async (event) => {
          if (event.data === '[DONE]') {
            const translatedMessage = await handleTranslation();
            console.log('onmessage translated message : ', translatedMessage);
            setApiMessageFinal(pending ?? '');
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? '']],
              messages: [
                ...state.messages,
                {
                  type: 'apiMessage',
                  message: state.pending ?? '',
                  sourceDocs: state.pendingSourceDocs,
                },
              ],
              pending: undefined,
              pendingSourceDocs: undefined,
            }));
            // handleTranslation();
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            if (data.sourceDocs) {
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.sourceDocs,
              }));
            } else {
              setApiMessageFinal(data.data);
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? '') + data.data,
              }));
            }
          }
        },
      });
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  useEffect(() => {
    handleTranslation();
  }, [apiMessageFinal]);

  console.log('API message:', apiMessageFinal);

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

  const chatMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        message.type === 'userMessage' || message.message !== undefined,
    );
  }, [messages]);

  // console.log('messages : ', messages);

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
        <div className="col-9 text-center">
          <p className="mb-0">Chat With DFCC Bot</p>
          {/* <p className="mb-0">{trMsg}</p> */}
        </div>
        <div className="dropdown" id="languageDropdown">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton1"
            data-bs-toggle="dropdown"
            aria-expanded="true"
          >
            {selectedLanguage}
          </button>
          <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            <li
              className={`dropdown-item ${
                selectedLanguage === 'ENGLISH' ? 'active' : ''
              }`}
              onClick={() => setSelectedLanguage('ENGLISH')}
            >
              ENGLISH
            </li>
            <li
              className={`dropdown-item ${
                selectedLanguage === 'SINHALA' ? 'active' : ''
              }`}
              onClick={() => setSelectedLanguage('SINHALA')}
            >
              SINHALA
            </li>
            <li
              className={`dropdown-item ${
                selectedLanguage === 'TAMIL' ? 'active' : ''
              }`}
              onClick={() => setSelectedLanguage('TAMIL')}
            >
              TAMIL
            </li>
          </ul>
        </div>
      </div>

      <div className={`${styles.messageWrapper}`}>
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
                        {message.type === 'apiMessage' && trMsg && (
                          <div
                            className={`${styles.botMessageContainer} ${styles.apimessage} d-flex flex-column my-1`}
                          >
                            <p className="mb-0">{trMsg}</p>
                          </div>
                        )}
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
        <form onSubmit={handleSubmit}>
          <textarea
            disabled={loading}
            onKeyDown={handleEnter}
            ref={textAreaRef}
            autoFocus={false}
            rows={1}
            maxLength={512}
            id="userInput"
            name="userInput"
            placeholder={
              loading
                ? 'Waiting for response...'
                : 'What is this question about?'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.textarea}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${styles.inputIconContainer} `}
          >
            {loading ? (
              <div className={styles.loadingwheel}>
                <LoadingDots color="#fff" />
                {/* <LoadingIcons.ThreeDots /> */}
              </div>
            ) : (
              // Send icon SVG in input field
              <AiOutlineSend className={styles.sendIcon} />
            )}
          </button>
        </form>
      </div>
      {error && (
        <div className="border border-red-400 rounded-md p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {/* input fields ================= */}
    </Layout>
  );
}
