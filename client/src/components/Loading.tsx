import { useState, useEffect, useRef } from "react";
import logo from "/logo.png";

export default function Loading({ isLoading }: { isLoading: boolean }) {
  const messages = [
    "Still connecting…",
    "Waking up the server 😴",
    "Almost ready…",
    "Hold on a sec…",
    "Sorry for the wait — free hosting needs a quick warm-up sometimes 🙃",
  ];
  const [message, setMessage] = useState("Connecting to CoCanvas...");
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
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
      }, 5000);
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <img src={logo} alt="Loading..." />
            <div className="spinner"></div>
            <p>{message}</p>
          </div>
        </div>
      )}
    </>
  );
}
