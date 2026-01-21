import { useState, useEffect, useRef } from "react";
import logo from "/logo.png";
import { useError } from "../context/ErrorContext";

export default function Loading({ isLoading }: { isLoading: boolean }) {
  const messages = [
    "Connecting to CoCanvas...",
    "Waking up the server 😴",
    "⏳ Booting the server can take a while. Feel free to wait, or come back in 5 minutes — we’ll keep it ready for you.",
  ];
  const [message, setMessage] = useState("Connecting to CoCanvas...");
  const intervalRef = useRef<number | null>(null);
  const { error } = useError();

  useEffect(() => {
    if (!isLoading) {
      setMessage("Connecting to CoCanvas...");
      return;
    }

    let i = 0;
    setMessage(messages[i]);
    intervalRef.current = setInterval(() => {
      i++;

      if (i < messages.length) {
        setMessage(messages[i]);
      }

      if (i === messages.length - 1 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <img src={logo} alt="Loading..." />
            {!error && (
              <>
                <div className="spinner"></div> <p>{message}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
