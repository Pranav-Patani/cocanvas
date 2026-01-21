import { useError } from "../context/ErrorContext";
import { MdErrorOutline } from "react-icons/md";

export default function Error() {
  const { error } = useError();
  if (!error) return null;
  return (
    <div className="error-popup">
      <h2 className="error-title">
        <MdErrorOutline className="error-icon" /> An error occurred
      </h2>
      <p className="error-message">{error}</p>
    </div>
  );
}
