import { useState, useEffect } from "react";

export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('eudr_tutorial_completed');
    if (hasSeenTutorial) {
      setShowTutorial(false);
    }
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const skipTutorial = () => {
    setIsActive(false);
    localStorage.setItem('eudr_tutorial_completed', 'true');
    setShowTutorial(false);
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    localStorage.removeItem('eudr_tutorial_completed');
    setShowTutorial(true);
  };

  return {
    isActive,
    currentStep,
    completedSteps,
    showTutorial,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    resetTutorial
  };
};