import { useUser } from "../hooks/use-user";
import { useLatency } from "../hooks/use-latency";
import { Badge } from "@supabase/ui";

const LatencyBadge = () => {
  const { user, signOut } = useUser();
  const latency = useLatency();

  const color = latency > 150 ? "red" : latency > 100 ? "yellow" : "green";

  return (
    <div className="absolute right-0 bottom-0 p-2" onDoubleClick={signOut}>
      <Badge color={color} dot>{`${latency.toFixed(1)}ms // ${
        user?.id ?? ""
      }`}</Badge>
    </div>
  );
};

export default LatencyBadge;
