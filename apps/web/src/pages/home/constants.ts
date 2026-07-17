export const WRAP = "mx-auto w-full max-w-[1280px] px-6 md:px-12";

export const GRADIENTS: Record<string, string> = {
  twilight: "bg-gradient-to-br from-[#D97757] via-[#8C3E20] to-[#2E4A3F]",
  forest: "bg-gradient-to-br from-[#B8C9C1] via-[#4A6F61] to-[#1C2E27]",
  morning: "bg-gradient-to-b from-[#F2C9B5] via-[#FBF8F2] to-[#B8C9C1]",
  night: "bg-gradient-to-br from-[#4A6F61] via-[#2E4A3F] to-[#1A1A1A]",
  sand: "bg-gradient-to-br from-[#FBF8F2] via-[#DDD2BE] to-[#C4B59B]",
  terracotta: "bg-gradient-to-br from-[#F2C9B5] via-[#D97757] to-[#8C3E20]",
};

export const STAR_RATING = Array.from({ length: 5 }, (_, i) => i);
