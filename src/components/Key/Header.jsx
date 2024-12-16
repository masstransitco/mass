import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import "./Header.css";
import { AuthContext } from "../../context/AuthContext";
import classNames from "classnames";
import LockUnlockModal from "../Key/Master"; // Import the LockUnlockModal component

const Header = () => {
  const { user, loading, logout, googleSignIn } = useContext(AuthContext);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isLockUnlockModalVisible, setIsLockUnlockModalVisible] =
    useState(false); // State for LockUnlockModal visibility
  const dropdownRef = useRef(null);
  const firstDropdownItemRef = useRef(null);

  const toggleDropdown = useCallback(() => {
    setDropdownVisible((prev) => !prev);
  }, []);

  const handleClickOutside = useCallback(
    (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    },
    [dropdownRef]
  );

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      setDropdownVisible(false);
    }
  }, []);

  const handleAvatarKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleDropdown();
      }
    },
    [toggleDropdown]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  useEffect(() => {
    if (dropdownVisible && firstDropdownItemRef.current) {
      firstDropdownItemRef.current.focus();
    }
  }, [dropdownVisible]);

  if (loading && !user) {
    return (
      <div className="loading">
        <div className="spinner" aria-label="Loading"></div>
      </div>
    );
  }

  const avatarSrc =
    typeof user?.photoURL === "string" ? user.photoURL : "/default-avatar.png";
  const displayName =
    typeof user?.displayName === "string" ? user.displayName : "User";

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Logo Section */}
          <div
            className="logo"
            onClick={() => setIsLockUnlockModalVisible(true)} // Open LockUnlockModal on logo click
          >
            <img src="/logo.png" alt="ReactMTC Logo" className="logo-image" />
          </div>

          {/* User Section */}
          <div className="user-section">
            {user ? (
              <div className="user-info" ref={dropdownRef}>
                <button
                  className="user-avatar-button"
                  onClick={toggleDropdown}
                  onKeyDown={handleAvatarKeyDown}
                  aria-expanded={dropdownVisible}
                  aria-controls="user-dropdown"
                  aria-haspopup="true"
                >
                  <img src={avatarSrc} alt="User Avatar" />
                  <span className="user-name">{displayName}</span>
                </button>
                <div
                  id="user-dropdown"
                  className={classNames("dropdown-menu", {
                    show: dropdownVisible,
                  })}
                  role="menu"
                  aria-labelledby="user-avatar-button"
                >
                  <ul>
                    <li role="none">
                      <a
                        href="/account"
                        role="menuitem"
                        ref={firstDropdownItemRef}
                      >
                        Account
                      </a>
                    </li>
                    <li role="none">
                      <a href="/activity" role="menuitem">
                        Activity
                      </a>
                    </li>
                    <li role="none">
                      <a href="/payment" role="menuitem">
                        Payment
                      </a>
                    </li>
                    <li role="none">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          logout();
                        }}
                        className="logout-button"
                        aria-label="Logout"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="button-wrapper">
                {/* Sign-In Button */}
                <button
                  className="signin-button"
                  onClick={googleSignIn}
                  disabled={loading}
                  aria-label="Sign in with Google"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                {/* Get Started Button */}
                <button
                  className="get-started-button"
                  onClick={() => window.open("https://air.city", "_blank")}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LockUnlock Modal */}
      <LockUnlockModal
        isOpen={isLockUnlockModalVisible} // Pass visibility state
        onClose={() => setIsLockUnlockModalVisible(false)} // Close modal handler
      />
    </>
  );
};

export default Header;
