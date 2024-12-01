import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Home } from "../pages/Home";
import { Room } from "../pages/Room";
import { NotFound } from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "room/:roomId",
        element: <Room />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
