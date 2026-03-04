import Image from "next/image";
import {ScoreGauge} from "@/components/ScoreGauge";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ScoreGauge score={40} label={"Gauge"} />
    </div>
  );
}
