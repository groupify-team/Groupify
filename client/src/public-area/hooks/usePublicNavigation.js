import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth-area/contexts/AuthContext.jsx";

export const usePublicNavigation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSmoothNavigation = (to, delay = 300) => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s ease-out";
    
    setTimeout(() => {
      navigate(to);
    }, delay);
  };

  const handleGetStarted = (e) => {
    e?.preventDefault();
    
    // Set the fade-out animation
    document.body.style.transition = "opacity 0.2s ease-out";
    document.body.style.opacity = "0";

    // Navigate after fade completes
    setTimeout(() => {
      if (currentUser) {
        navigate("/dashboard");
      } else {
        navigate("/signup");
      }
    }, 300);
  };

  const handleSignIn = (e) => {
    e?.preventDefault();
    handleSmoothNavigation("/signin");
  };

  const handleSignUp = (e) => {
    e?.preventDefault();
    handleSmoothNavigation("/signup");
  };

  return {
    handleSmoothNavigation,
    handleGetStarted,
    handleSignIn,
    handleSignUp,
    currentUser,
  };
};