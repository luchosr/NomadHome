import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { availabilityApi } from "../api/availability.js";
import { extractApiMessage } from "../api/client.js";

export function useListingAvailability(id: string | undefined) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);

  const { data: blocks = [] } = useQuery({
    queryKey: ["host", "listings", id, "availability"],
    queryFn: () => availabilityApi.list(id!),
    enabled: !!id,
  });

  const addBlock = async () => {
    setBlockError(null);
    try {
      await availabilityApi.block(id!, startDate, endDate);
      await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "availability"] });
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setBlockError(extractApiMessage(err) ?? t("error.generic.unexpected"));
    }
  };

  const deleteBlock = async (blockId: string) => {
    await availabilityApi.deleteBlock(id!, blockId);
    await queryClient.invalidateQueries({ queryKey: ["host", "listings", id, "availability"] });
  };

  return {
    blocks,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    blockError,
    addBlock,
    deleteBlock,
  };
}
