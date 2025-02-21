import { useState, useRef } from "react";

import cn from "classnames";
import TextareaAutosize from "react-textarea-autosize";
import { usePrompt } from "./hooks/usePrompt";
import Markdown from "react-markdown";
import { useLanguageDetector } from "./hooks/useLanguageDetector";
import { useSummarizer } from "./hooks/useSummarizer";
import { v4 } from "uuid";
import { useTranslator } from "./hooks/useTranslator";
import { useEffect } from "react";
import { BiTrash, BiX, BiMenu, BiSend } from "react-icons/bi";
import cinta from "./assets/cinta.png";
import doodle from "./assets/doodle.png";
import LandPage from "./components/Loader";

const languages = ["en", "pt", "es", "ru", "tr", "fr"];
const languageMap = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  ru: "Russian",
  tr: "Turkish",
  fr: "French",
};
const messagesStorageKey = "cintabot::messages";
const sessionsStorageKey = "cintabot::sessions";
const activeSessionStorageKey = "cintabot::activeSession";

const getDefaultSessions = () => {
  const sessions = window.localStorage.getItem(sessionsStorageKey);
  return sessions ? JSON.parse(sessions) : [];
};

const getSessionMessages = (sessionId) => {
  const messages = window.localStorage.getItem(
    `${messagesStorageKey}::${sessionId}`
  );
  return messages
    ? JSON.parse(messages)
    : [
        {
          id: v4(),
          role: "assistant",
          text: "Hi there, how can I help you today?",
        },
      ];
};

const getActiveSession = () => {
  const activeSession = window.localStorage.getItem(activeSessionStorageKey);
  return activeSession ? JSON.parse(activeSession) : undefined;
};

function App() {
  const form = useRef();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [sessions, setSession] = useState(getDefaultSessions());
  const [activeSession, setActiveSession] = useState(getActiveSession());
  const [messages, setMessages] = useState(getSessionMessages(activeSession));

  useEffect(() => {
    if (messages.length && activeSession) {
      window.localStorage.setItem(
        `${messagesStorageKey}::${activeSession}`,
        JSON.stringify(messages)
      );
    }
  }, [messages]);

  useEffect(() => {
    if (activeSession) {
      window.localStorage.setItem(
        activeSessionStorageKey,
        JSON.stringify(activeSession)
      );
    }
  }, [activeSession]);

  useEffect(() => {
    if (sessions) {
      window.localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
    }
  }, [sessions]);

  const { prompt, prompting } = usePrompt();
  const { detectLanguage, detecting } = useLanguageDetector();
  const { summarize, summarizing } = useSummarizer();
  const { translate, translating } = useTranslator();

  const [message, setMessage] = useState("");
  const [messageTranslateTarget, setMessageTranslateTarget] = useState({});

  const handleError = (message) => {
    setMessages((messages) => [
      ...messages,
      { id: v4(), role: "assistant", text: message, isError: true },
    ]);
  };

  const handleSumbit = async (e) => {
    e.preventDefault();
    try {
      const userMessage = message;
      const detectedLanguage = await detectLanguage(userMessage);
      setMessages((messages) => [
        ...messages,
        { id: v4(), role: "user", text: userMessage, detectedLanguage },
      ]);
      setMessage("");
      if (detectedLanguage === "en" && userMessage.split(" ").length <= 150) {
        const res = await prompt(userMessage);
        setMessages((messages) => [
          ...messages,
          { id: v4(), role: "assistant", text: res },
        ]);
      }
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleSummarize = async (message) => {
    try {
      const summary = await summarize(message);
      setMessages((messages) => [
        ...messages,
        { id: v4(), role: "assistant", text: summary },
      ]);
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleTranslate = async (messageId) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      const targetLanguage = messageTranslateTarget[messageId];
      if (!targetLanguage || targetLanguage === message.detectedLanguage)
        return;
      const translation = await translate(
        message.detectedLanguage,
        targetLanguage,
        message.text
      );
      setMessages((messages) => [
        ...messages,
        { id: v4(), role: "assistant", text: translation },
      ]);
    } catch (error) {
      handleError(error.message);
    }
  };

  const updateSessionName = (sessionId) => {
    setTimeout(async () => {
      const sessionMessages = getSessionMessages(sessionId);

      if (sessionMessages.filter((s) => s.role === "assistant").length <= 1) {
        console.log("Cant update name yet, retrying in 5 seconds");
        return updateSessionName(sessionId);
      }

      console.log("Updating name now...");
      const summary = await prompt(`
      In a 10 word sentence, give me a summary of the text below
      ${sessionMessages.map((s) => s.text).join("\n")}
      `);

      setSession((sessions) =>
        sessions.map((s) => (s.id === sessionId ? { ...s, name: summary } : s))
      );
    }, 5000);
  };

  const handleNewChatCreation = () => {
    const newSession = { id: v4(), name: "New Chat" };
    setSession((sessions) => [...sessions, newSession]);
    setActiveSession(newSession.id);
    setMessages(getSessionMessages(newSession.id));
    updateSessionName(newSession.id);
  };

  const handleSessionSwitch = (sessionId) => {
    setActiveSession(sessionId);
    setMessages(getSessionMessages(sessionId));
  };

  const deleteSession = (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    window.localStorage.removeItem(`${messagesStorageKey}::${sessionId}`);
    setActiveSession(undefined);
    setSession((sessions) => sessions.filter((s) => s.id !== sessionId));
    setMessage([]);
  };

  const StartChatButton = ({ block }) => {
    return (
      <button
        onClick={handleNewChatCreation}
        className={cn(
          "p-4 text-left  text-black text-sm flex justify-between items-center bg-green-200 rounded-lg cursor-pointer mb-4",
          { "w-full ": block }
        )}
      >
        Start new chat
      </button>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col">
      <header className="w-full">
        <nav className="bg-[#daf2e2] flex justify-start items-center p-2 px-10">
          <button
            className="min-w-[40px] min-h-[40px] flex justify-center items-center p-2 my-2 bg-green-300 rounded-lg  group relative"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <BiMenu />
          </button>
          <div className="flex">
            <img src={cinta} alt="" className="w-15" />
            <h1
              className="text-3xl mt-3"
              style={{ fontFamily: "Pixelify Sans", fontSize: "2rem" }}
            >
              CintaBot
            </h1>
          </div>
          <div className="mt-2"></div>
        </nav>
      </header>

      <div className="flex  w-full h-full">
        {/* side bar starts here  */}

        <nav
          className={cn(
            "w-full max-w-[250px] fixed top-[76px] left-0 lg:static h-full z-10 transition-all overflow-hidden duration-300 bg-gray-100 border-r border-gray-100 p-5",
            {
              "!w-[0px] !max-w-[0px] !p-0": !isSidebarOpen,
            }
          )}
        >
          <StartChatButton block />
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSessionSwitch(session.id)}
              className={cn(
                "w-full transition-all duration-300 p-4 text-left text-black text-sm flex justify-between items-center border border-green-300 bg-[#daf2e2]  rounded-lg cursor-pointer mb-4 hover:opacity-70",
                {
                  "!border-2": activeSession === session.id,
                }
              )}
            >
              <span className="max-w-[90%] truncate">{session.name}</span>
              <span
                onClick={(e) => deleteSession(e, session.id)}
                className="w-[20px] h-[20px] bg-green-300/50 flex justify-center items-center leading-0 p-1 cursor-pointer rounded-[4px]"
              >
                <BiTrash />
              </span>
            </button>
          ))}
        </nav>
        {sessions.length > 0 && activeSession ? (
          // main container for the chats

          <div
            className="relative bg-repeat bg-center bg-contain w-full h-full p-10 "
            style={{ backgroundImage: `url(${doodle})` }}
          >
            {/* this is overlay for the background */}
            <div className="absolute inset-0 bg-white/94">
              <div className=" flex w-full h-full flex-col p-5">
                <div
                  className="w-full grow h-fit md:p-5 no-scrollbar overflow-y-auto flex"
                  style={{ flexFlow: "column nowrap" }}
                >
                  {messages.map((message, i) => {
                    const isUserMessage = message.role === "user";
                    const showSummarizer =
                      message.text?.split(" ").length > 150;
                    const showTranslator = isUserMessage;
                    const showDetectedLanguage =
                      isUserMessage && !!message.detectedLanguage;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "text-white w-fit max-w-[90%] md:max-w-[48%] my-2",
                          {
                            "self-end flex items-end flex-col": isUserMessage,
                            "mt-auto": i === 0,
                          }
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm py-2.5 bg-gray-100 text-black border border-green-500 rounded-lg px-3 w-full",
                            {
                              "!border-red-800 bg-red-500 !text-white":
                                message.isError,
                            }
                          )}
                        >
                          <Markdown>{message.text}</Markdown>
                        </div>
                        {(showSummarizer ||
                          showDetectedLanguage ||
                          showTranslator) && (
                          <div
                            className={cn("px-2 py-2 flex items-center gap-4", {
                              "flex-row-reverse": isUserMessage,
                            })}
                          >
                            {showDetectedLanguage && (
                              <span className=" text-black text-xs">
                                Lang:{" "}
                                <b>{message.detectedLanguage.toUpperCase()}</b>
                              </span>
                            )}
                            {showSummarizer && (
                              <button
                                disabled={summarizing}
                                onClick={() => handleSummarize(message.text)}
                                className="text-[10px] py-1 px-2 bg-green-200 rounded-lg cursor-pointer"
                              >
                                Summarize
                              </button>
                            )}
                            {showTranslator && (
                              <div className="text-black flex items-center gap-3 border border-green-200 rounded-lg pl-2 overflow-hidden">
                                <select
                                  defaultValue={message.detectedLanguage}
                                  onChange={(e) =>
                                    setMessageTranslateTarget((targets) => ({
                                      ...targets,
                                      [message.id]: e.target.value,
                                    }))
                                  }
                                  className="focus-within:outline-0 text-xs"
                                >
                                  {languages.map((lang) => (
                                    <option value={lang} key={lang}>
                                      {languageMap[lang]}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleTranslate(message.id)}
                                  className="text-[10px] py-1 px-2 bg-green-200 cursor-pointer"
                                >
                                  Translate
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(prompting || detecting || summarizing || translating) && (
                    <div className="text-white  flex items-center gap-1.5 text-sm">
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-200 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-sky-500"></span>
                      </span>
                      <span>
                        {detecting
                          ? "Detecting language"
                          : summarizing
                            ? "Summarizing"
                            : translating
                              ? "Translating"
                              : "Thinking"}
                        ...
                      </span>
                    </div>
                  )}
                </div>

                <form
                  ref={form}
                  onSubmit={handleSumbit}
                  className="mx-auto mt-5 w-full md:w-[80%] flex bg-gray-400 border-none  items-center rounded-xl px-5"
                >
                  <TextareaAutosize
                    autoFocus
                    rows={1}
                    value={message}
                    maxRows={5}
                    style={{ WebkitUserDrag: "none", userDrag: "none" }}
                    onDragStart={(e) => e.preventDefault()}
                    draggable={false}
                    placeholder="Type here.."
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        console.log("Submitting...");
                        form.current.requestSubmit();
                      }
                    }}
                    className="resize-none px-5 py-4 grow text-md focus:ring-0 active:ring-0 focus-visible:ring-0 focus-visible:outline-0 text-white placeholder:text-white no-scrollbar"
                  />
                  <button
                    disabled={
                      prompting || detecting || summarizing || translating
                    }
                    className="cursor-pointer text-white"
                    type="submit"
                  >
                    <BiSend size={35} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className=" w-full h-full flex justify-center items-center">
            <div
              className="relative bg-repeat bg-center bg-contain place-items-center text-center align-middle   w-full h-full"
              style={{ backgroundImage: `url(${doodle})` }}
            >
              <div className="flex w-full h-full justify-center items-center inset-0 bg-white/94">
                <div className="border-none mx-auto my-100  ">
                  {" "}
                  <StartChatButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
