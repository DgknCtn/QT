import { Bitcoin } from "lucide-react";
import { BrokerLogPage } from "@/components/broker-log/broker-log-page";

export default function BinanceLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <BrokerLogPage
      source="BINANCE_FUTURES"
      icon={Bitcoin}
      subtitle="Binance Futures pozisyonları · seans ve çeyrek kırılımlı"
      searchParams={searchParams}
    />
  );
}
