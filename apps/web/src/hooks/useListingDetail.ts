import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "../api/listings.js";
import { useAuth } from "../contexts/auth.js";
import { ApiError } from "../api/client.js";

export function useListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getDetail(id!),
    enabled: !!id,
    retry: (failCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failCount < 2;
    },
  });

  const { data: blockedRanges = [] } = useQuery({
    queryKey: ["listing", id, "blocked-dates"],
    queryFn: () => listingsApi.getBlockedDates(id!),
    enabled: !!id,
  });

  const sortedPhotos = listing ? [...listing.photos].sort((a, b) => a.position - b.position) : [];
  const primaryPhoto = sortedPhotos[0];
  const thumbnails = sortedPhotos.slice(1);
  const isGuest = user?.roles.includes("guest") ?? false;
  const datesValid = checkIn.length > 0 && checkOut.length > 0 && checkOut > checkIn;

  const handleDateChange = (newIn: string, newOut: string) => {
    setCheckIn(newIn);
    setCheckOut(newOut);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newIn) next.set("checkIn", newIn);
        else next.delete("checkIn");
        if (newOut) next.set("checkOut", newOut);
        else next.delete("checkOut");
        return next;
      },
      { replace: true },
    );
  };

  return {
    id,
    listing,
    isLoading,
    error,
    authLoading,
    user,
    isGuest,
    checkIn,
    checkOut,
    blockedRanges,
    datesValid,
    handleDateChange,
    primaryPhoto,
    thumbnails,
  };
}
