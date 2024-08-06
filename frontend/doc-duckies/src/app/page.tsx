// page.tsx
import { DashBoard } from "@/components/dash-board";
import MyApp from "../../pages/_app";


export default function Home() {
  return (
    <MyApp Component={DashBoard} />
  );
}
