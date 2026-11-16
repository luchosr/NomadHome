import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DAY_MS = 86_400_000;

/** Whole nights between two ISO dates (YYYY-MM-DD); null when either is missing or the range is not forward. */
export function nightsBetween(checkIn: string, checkOut: string): number | null {
  if (!checkIn || !checkOut) return null;
  const from = Date.parse(`${checkIn}T00:00:00Z`);
  const to = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return null;
  return Math.round((to - from) / DAY_MS);
}

export function useHomeSearch() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const nights = nightsBetween(checkIn, checkOut);

  const submit = () => {
    const params: string[] = [];
    const q = city.trim();
    if (q) params.push(`city=${encodeURIComponent(q)}`);
    if (checkIn) params.push(`checkIn=${encodeURIComponent(checkIn)}`);
    if (checkOut) params.push(`checkOut=${encodeURIComponent(checkOut)}`);
    navigate(params.length ? `/search?${params.join("&")}` : "/search");
  };

  return { city, setCity, checkIn, setCheckIn, checkOut, setCheckOut, nights, submit };
}
