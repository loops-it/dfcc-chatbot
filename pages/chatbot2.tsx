import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import LoadingDots from '@/components/ui/LoadingDots';
import { AiOutlineSend } from 'react-icons/ai';
import { Document } from 'langchain/document';

export default function Chatbot() {
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
    messages: [],
    history: [],
    pendingSourceDocs: [],
  });

  const [resMessageState, setResMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ENGLISH');
  const [trMsg, setTrMsg] = useState('');
  const [id, setId] = useState('');
  const [checkNotSure, setCheckNotSure] = useState(false);
  const [liveAgent, setLiveAgent] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState(0);
  const [hover, setHover] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showChatRating, setShowChatRating] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentInfoMsg, setAgentInfoMsg] = useState(false);
  const [agentImage, setAgentImage] = useState('/chat-header.png');









  useEffect(() => {
    const now = Date.now();
    const newId = now.toString();
    setId(newId);
  }, []);
  // console.log('user id : ',id)

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    // console.log("text there : ", checkNotSure)
  }, [checkNotSure, liveAgent, agentName, agentInfoMsg, agentImage]);


















  async function handleTranslation(response: string) {
    const responseTranslate = await fetch(
      'http://localhost:5000/translate-to-language',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultMessage: response,
          language: selectedLanguage,
          chatId: id,
        }),
      },
    );

    if (responseTranslate.status !== 200) {
      const error = await responseTranslate.json();
      throw new Error(error.message);
    }
    const botMessage = await responseTranslate.json();
    const translatedMessage = botMessage.translationsToEng[0];

    console.log(translatedMessage);

    return translatedMessage;
  }












  useEffect(() => {

    if (liveAgent === true) {
      console.log("----------", id)
      const interval = setInterval(async () => {
        const response = await fetch('http://localhost:5000/live-chat-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId: id }),
        });

        if (response.status !== 200) {
          const error = await response.json();
          throw new Error(error.message);
        }
        const data = await response.json();
        console.log('live chat agent : ', data.agent_id);
        console.log('live chat status : ', data.chat_status);
        console.log('live chat message : ', data.agent_message);
        console.log('live agent name : ', data.agent_name);
        console.log('live profile_picture : ', data.profile_picture);
  
        if(data.chat_status === "closed"){
          setShowChatRating(true);
        }
        else{
          setShowChatRating(false);
          setAgentInfoMsg(false);
          if(data.agent_id != "unassigned"){
            if(!data.profile_picture){
              setAgentImage("/chat-header.png");
            }
            else{
              setAgentImage("http://localhost:5000/uploads/"+data.profile_picture);
            }
            setAgentName(data.agent_name);
            
            setAgentInfoMsg(true);
            if(data.agent_message != null){
              setMessageState((state) => ({
                ...state,
                messages: [
                  ...state.messages,
                  {
                    type: 'apiMessage',
                    message: data.agent_message,
                  },
                ],
                pending: undefined,
              }));
            }
          }
          
        } 
      }, 5000);

      // {data && (
      //     <p>{data.message}</p>
      //   )}

      return () => clearInterval(interval);
    }
  }, [id, liveAgent]);
















  //handle form submission
  async function handleSubmit(e: any) {
    if (liveAgent === false) {
      e.preventDefault();

      setError(null);

      if (!query) {
        alert('Please input a question');
        return;
      }
      // get user message
      let question = query.trim();

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

      console.log('user message : ', question);

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
      console.log('translatesd user message : ', data.translationsToEng[0]);

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
              if (pending) {
              }
              setLoading(false);
              ctrl.abort();
            } else {
              try {
                const data = JSON.parse(event.data);
                if (data.sourceDocs) {
                  setMessageState((state) => ({
                    ...state,
                    pendingSourceDocs: data.sourceDocs,
                  }));
                } else {

                  if (data.data.includes("Hmm")) {
                    setCheckNotSure(true);
                  }

                  const translatedMessage = await handleTranslation(data.data);
                  setMessageState((state) => {
                    const lastMessage = state.messages[state.messages.length - 1];
                    let newMessages = [...state.messages];
                    if (lastMessage && lastMessage.type === 'apiMessage') {
                      newMessages[newMessages.length - 1] = {
                        type: 'apiMessage',
                        message: lastMessage.message + '\n' + translatedMessage,
                        sourceDocs: state.pendingSourceDocs,
                      };
                    } else {
                      newMessages.push({
                        type: 'apiMessage',
                        message: translatedMessage,
                        sourceDocs: state.pendingSourceDocs,
                      });
                    }
                    return {
                      history: [
                        ...state.history,
                        [question, state.pending ?? ''],
                      ],
                      messages: newMessages,
                      pending: undefined,
                      pendingSourceDocs: undefined,
                    };
                  });
                }
              } catch (error) {
                setLoading(false);
                setError(
                  'An error occurred while fetching the data. Please try again.',
                );
                console.log('error', error);
                ctrl.abort();
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
  }















  const handleLiveAgent = async (e: any) => {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }
    let question = query.trim();
    console.log('========== Go to live agent =========')
    if (liveAgent === true) {
      const response = await fetch('http://localhost:5000/live-chat-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: id, user_Message: question }),
      });

      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(error.message);
      }
      const data = await response.json();


      console.log('live chat agent : ', data.agent_id);
      console.log('live chat status : ', data.chat_status);
      console.log('live chat message : ', data.agent_message);
      setQuery('');
    }
  }



  const SwitchToLiveAgent = async () => {
    console.log('========== Switch to live agent =========')
      const response = await fetch('http://localhost:5000/switch-to-live-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: id }),
      });

      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(error.message);
      }
      const data = await response.json();
      console.log('if success : ',data.success)
      if(data.success === 'Success'){
        setLiveAgent(true);
      }
  }









  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
        handleLiveAgent(e);
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
  // console.log(messages);

  // console.log('messages : ', messages);












  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);









  async function sendRateValues() {
    // const sendData = async (botName, index) => {
    try {
      const response = await fetch('http://localhost:5000/save-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          ratingValue: rating,
          feedbackMessage: inputValue,
        }),
      });
      const ratingData = await response.json();
      // console.log(ratingData)
    } catch (error) {
      console.error(error);
    }
    // }
    // console.log(inputValue);
    // console.log(rating);
  }












  return (
    <Layout>
      {/* chat top header */}
      <div className={`${styles.chatTopBar} d-flex flex-row `}>
        <div className="text-center d-flex flex-row justify-content-between px-2">
          <Image src="/chat-top-bar.png" alt="AI" width={150} height={30} />
        </div>
      </div>
     

      <div className={`${styles.messageWrapper}`}>
      







        <div className={styles.botMessageContainerWrapper}>
          <div className="d-flex justify-content-center pt-1">
            <Image src="/chat-logo.png" alt="AI" width={180} height={50} />
          </div>
          <div
            className={`${styles.botChatMsgContainer} d-flex flex-column my-2`}
          >
            <div className="d-flex">
              <Image src="/chat-header.png" alt="AI" width="40" height="40" />
            </div>
            <div className={`d-flex flex-column py-3`}>
              <div
                className={`welcomeMessageContainer d-flex flex-column align-items-center`}
              >
                <Image
                  src="/language-img.png"
                  alt="AI"
                  width={220}
                  height={150}
                />
                <p className="mt-2">
                  Hello, Welcome to DFCC Bank. Please select the language to get
                  started.
                </p>
                <p className="">
                  ආයුබෝවන්, DFCC බැංකුවට සාදරයෙන් පිළිගනිමු. ඔබේ ප්‍රශ්නවලට
                  පිළිතුරු සැපයීම සඳහා කරුණාකර භාෂාව තෝරන්න.
                </p>
                <p className="">
                  வணக்கம், DFCC வங்கிக்கு உங்களை வரவேற்கிறோம். தொடர்வதற்கு,
                  விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்
                </p>

                <div className="d-flex flex-row welcome-language-select">
                  <div className="col-4 p-1">
                    <button
                      className=" px-3 py-2 rounded"
                      onClick={() => {
                        setSelectedLanguage('English');
                        setMessageState((state) => ({
                          ...state,
                          messages: [
                            ...state.messages,
                            {
                              type: 'apiMessage',
                              message: 'English',
                            },
                          ],
                          pending: undefined,
                        }));
                      }}
                    >
                      English
                    </button>
                  </div>
                  <div className="col-4 p-1">
                    <button
                      className="px-3 py-2 rounded"
                      onClick={() => {
                        setSelectedLanguage('Sinhala');
                        setMessageState((state) => ({
                          ...state,
                          messages: [
                            ...state.messages,
                            {
                              type: 'apiMessage',
                              message: 'Sinhala',
                            },
                          ],
                          pending: undefined,
                        }));
                      }}
                    >
                      Sinhala
                    </button>
                  </div>

                  <div className="col-4 p-1">
                    <button
                      className="px-3 py-2 rounded"
                      onClick={() => {
                        setSelectedLanguage('Tamil');
                        setMessageState((state) => ({
                          ...state,
                          messages: [
                            ...state.messages,
                            {
                              type: 'apiMessage',
                              message: 'Tamil',
                            },
                          ],
                          pending: undefined,
                        }));
                      }}
                    >
                      Tamil
                    </button>
                  </div>
                </div>
              </div>
              {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
            </div>
          </div>
        </div>


















        {
            agentInfoMsg && (
              <div className="alert alert-info mx-3 text-center  alert-dismissible fade show" role="alert">
                Now you are chatting with {agentName}
                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            )
          }
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
            // let visibility = 'd-none';
            // console.log("msg : ", message)

            if (message.type === 'apiMessage') {
              icon = (
                <Image
                  src={agentImage}
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

            const isLastApiMessageWithNotSure =
              message.type === 'apiMessage' &&
              message.message.includes("Hmm") &&
              index === chatMessages.length - 1;


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
                        {isLastApiMessageWithNotSure && (
                          <button
                            className={`bg-dark rounded text-white py-2 px-3 my-3`}
                            style={{ width: 'max-content', alignSelf: 'center' }}
                            onClick={() => { SwitchToLiveAgent() }}
                          >
                            Connect with Live Agent
                          </button>
                        )}
                      </div>

                      {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
                    </div>
                  </div>
                </div>

              </>
            );
          })}











          {showChatRating && (
            <div className="d-flex flex-column" id='chatRating'>
              <div className="d-flex">
                <Image src="/chat-header.png" alt="AI" width="40" height="40" />
              </div>
              <div className={`d-flex flex-column px-1 py-2`}>
                <div
                  className={`welcomeMessageContainer d-flex flex-column align-items-center`}
                >
                  <div className="container-fluid m-0 p-0">
                    <div
                      className={`${styles.botRateRequest} d-flex flex-row my-2 mx-2`}
                    >
                      <div
                        className={`${styles.botRatingContainer} d-flex flex-column my-1`}
                      >
                        <p className={`${styles.rateTitle} mb-0 text-dark`}>
                          Rate your conversation
                        </p>
                        <p className="text-dark mb-0">Add your rating</p>
                        <div className="star-rating">
                          {[...Array(5)].map((star, index) => {
                            index += 1;
                            return (
                              <button
                                type="button"
                                key={index}
                                className={
                                  index <= (hover || rating) ? 'on' : 'off'
                                }
                                onClick={() => {
                                  setRating(index);
                                }}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(rating)}
                              >
                                <span className="star">&#9733;</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className={` mb-0 mt-3 text-dark`}>Your feedback :</p>
                        <textarea
                          className={`${styles.textarea} p-2 rounded`}
                          rows={3}
                          maxLength={512}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />

                        <button
                          onClick={sendRateValues}
                          className="text-white bg-dark p-2 mt-2 rounded"
                        >
                          SEND
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
              </div>
            </div>
          )
          }









        </div>
      </div>

      {/* input fields =================*/}
      <div className={`${styles.inputContainer}`}>
        {/* <form > */}
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
          onClick={(liveAgent === false) ? handleSubmit : handleLiveAgent}
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
        {/* </form> */}
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
