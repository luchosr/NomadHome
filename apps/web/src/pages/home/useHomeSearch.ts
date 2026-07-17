import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useHomeSearch() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");

  const submit = () => {
    const q = city.trim();
    navigate(q ? `/search?city=${encodeURIComponent(q)}` : "/search");
  };

  return { city, setCity, submit };
}
