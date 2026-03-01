"use client";

import { useState, useEffect } from "react";
import { useLottie } from "lottie-react";

const ALERT_LOTTIE_URL = "/Alert.json";

function LottieView({ animationData, className = "" }) {
  const { View } = useLottie(
    { animationData, loop: true },
    { maxHeight: "100%", maxWidth: "100%" }
  );
  return (
    <div
      className={`flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      aria-hidden
    >
      {View}
    </div>
  );
}

export default function AlertLottie({ className = "" }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(ALERT_LOTTIE_URL)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => {});
  }, []);

  if (!animationData) return null;

  return <LottieView animationData={animationData} className={className} />;
}
