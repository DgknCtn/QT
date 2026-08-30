import { CandlestickChart } from "lucide-react";
import { BrokerLogPage } from "@/components/broker-log/broker-log-page";

export default function OkxLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <BrokerLogPage
      source="OKX"
      icon={CandlestickChart}
      subtitle="OKX perp pozisyonları · funding dahil, seans ve çeyrek kırılımlı"
      searchParams={searchParams}
    />
  );
}
