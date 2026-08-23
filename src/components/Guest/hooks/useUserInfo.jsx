import { useState } from "react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useUserInfo = (setStep) => {
  // ✅ Init depuis localStorage pour survivre à un refresh
  const [userInfo, setUserInfo] = useState(() => ({
    phone: localStorage.getItem("guest_phone") || "",
    email: localStorage.getItem("guest_email") || "",
    agent_id: localStorage.getItem("agent_id") || "",
  }));
  const [loading, setLoading] = useState(false);

  // ✅ Email validation regex
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ✅ Check if user info is valid (only phone and email are required)
  const isUserInfoValid = () => {
    return (
      userInfo.phone &&
      userInfo.phone.trim() !== '' &&
      userInfo.email &&
      userInfo.email.trim() !== '' &&
      isEmailValid(userInfo.email)
    );
  };

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();

    // ✅ Only check required fields (phone and email)
    if (isUserInfoValid()) {
      setLoading(true);
      await wait(2000);
      localStorage.setItem("guest_phone", userInfo.phone);
      localStorage.setItem("guest_email", userInfo.email);

      // Only save agent_id if provided
      if (userInfo.agent_id) {
        localStorage.setItem("agent_id", userInfo.agent_id);
      }

      setStep(4);
      setLoading(false);
    }
  };

  return {
    userInfo,
    setUserInfo,
    handleUserInfoSubmit,
    loading,
    isUserInfoValid // ✅ Export validation function
  };
};