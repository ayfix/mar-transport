import { Outlet } from "react-router-dom";
import Navbar from "../../components/client/Navbar";

export default function ClientLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
