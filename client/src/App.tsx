import CanvasBoard from "./canvas/CanvasBoard";
import Error from "./components/Error";
import { ErrorProvider } from "./context/ErrorContext";
function App() {
  return (
    <ErrorProvider>
      <CanvasBoard />
      <Error />
    </ErrorProvider>
  );
}

export default App;
