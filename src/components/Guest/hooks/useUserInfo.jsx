import { useState } from "react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useUserInfo = (setStep) => {
  const [userInfo, setUserInfo] = useState({ phone: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    if (userInfo.phone && userInfo.email) {
      setLoading(true);
      await wait(2000);
      localStorage.setItem("guest_phone", userInfo.phone);
      localStorage.setItem("guest_email", userInfo.email);
      setStep(4);
      setLoading(false);
    }
  };

  return { userInfo, setUserInfo, handleUserInfoSubmit, loading };
};
