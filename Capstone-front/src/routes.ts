import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./components/SplashScreen";
import { InputForm } from "./components/InputForm";
import { LoadingScreen } from "./components/LoadingScreen";
import { ResultsPage } from "./components/ResultsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/home",
    Component: InputForm,
  },
  {
    path: "/loading",
    Component: LoadingScreen,
  },
  {
    path: "/results",
    Component: ResultsPage,
  },
]);
