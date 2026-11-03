import React, { useState, useEffect } from "react";
import "./ExclusiveAccessGate.css";

// Recognized authorized credentials
const VALID_USERS = new Set([
  "investor",
  "qboltz",
  "q-boltz",
  "prs-investor",
  "partner",
  "evaluator",
  "demo",
  "ycombinator",
  "yc",
  "a16z",
  "romit"
]);

const VALID_PASSWORDS = new Set([
  "boltzmann2026",
  "qboltz2026",
  "pointreyessound",
  "electrons",
  "phase-space",
  "entropy12"
]);

export const AUTH_STORAGE_KEY = "prs_demo_authorized";
export const AUTH_USER_KEY = "prs_demo_user";

export function checkIsAuthenticated() {
  if (typeof window === "undefined") return false;

  // 1. Check persistent storage (sessionStorage or localStorage)
  try {
    const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const localAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionAuth === "true" || localAuth === "true") {
      return true;
    }
  } catch {
    // Storage access error fallback
  }

  // 2. Check URL query parameters for direct token / credentials
  try {
    const params = new URLSearchParams(window.location.search);
    const queryUser = (params.get("user") || "").trim().toLowerCase();
    const queryPass = (params.get("pass") || params.get("password") || "").trim();
    const queryKey = (params.get("key") || params.get("access") || params.get("token") || "").trim().toLowerCase();

    if (queryUser && queryPass) {
      if (VALID_USERS.has(queryUser) && VALID_PASSWORDS.has(queryPass)) {
        persistAuthentication(queryUser, true);
        return true;
      }
    }

    if (
      queryKey === "boltzmann2026" ||
      queryKey === "qboltz" ||
      queryKey === "qboltz2026" ||
      queryKey === "demo" ||
      queryKey === "investor"
    ) {
      persistAuthentication(queryKey || "investor", true);
      return true;
    }
  } catch {
    // URL parsing fallback
  }

  return false;
}

export function persistAuthentication(username, remember = true) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
    sessionStorage.setItem(AUTH_USER_KEY, username || "investor");
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(AUTH_USER_KEY, username || "investor");
    }
  } catch {
    // Storage fallback
  }
}

export function clearAuthentication() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Storage fallback
  }
}

export function getAuthenticatedUser() {
  if (typeof window === "undefined") return "investor";
  try {
    return sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY) || "investor";
  } catch {
    return "investor";
  }
}

export default function ExclusiveAccessGate({ onAuthenticate, onClose, onRequestAccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-check on mount
  useEffect(() => {
    if (checkIsAuthenticated()) {
      if (onAuthenticate) onAuthenticate();
    }
  }, [onAuthenticate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const userClean = username.trim().toLowerCase();
    const passClean = password.trim();

    if (!userClean) {
      setErrorMsg("Please enter your assigned username.");
      return;
    }
    if (!passClean) {
      setErrorMsg("Please enter your access password.");
      return;
    }

    setIsSubmitting(true);

    // Validate credentials
    const isUserValid = VALID_USERS.has(userClean);
    const isPassValid = VALID_PASSWORDS.has(passClean);

    setTimeout(() => {
      if (isUserValid && isPassValid) {
        persistAuthentication(userClean, rememberMe);
        setIsSubmitting(false);
        if (onAuthenticate) onAuthenticate();
      } else {
        setIsSubmitting(false);
        setErrorMsg("Access Denied: Invalid username or password. Please verify your credentials or contact access@pointreyessound.com.");
      }
    }, 280); // Brief realistic tactile delay
  };

  return (
    <div className="exclusive-gate-overlay" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="exclusive-gate-card">
        {/* Brand Bar */}
        <div className="gate-brand-row">
          <div className="gate-brand-left">
            <img src="/PRS_logo_v2.jpeg?v=5" alt="Point Reyes Sound" className="gate-brand-logo" />
            <div className="gate-brand-meta">
              <span className="gate-company-name">POINT REYES SOUND</span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                Q-BOLTZ SOLVER SUITE
              </span>
            </div>
          </div>

          <div className="gate-confidential-pill">
            <span className="gate-pulse-dot"></span>
            CONFIDENTIAL ACCESS
          </div>

          {onClose && (
            <button className="gate-close-btn" onClick={onClose} title="Return to Homepage" aria-label="Close">
              &times;
            </button>
          )}
        </div>

        {/* Header Text */}
        <div className="gate-header-text">
          <h2 id="gate-title" className="gate-title">
            <span className="gate-title-gradient">Exclusive Demonstration</span>
          </h2>
          <p className="gate-subtitle">
            Interactive Continuous Phase-Space Molecular Orbital Dynamics & Quantum Boltzmann Equation Engine.
          </p>
        </div>

        {/* Notice Box */}
        <div className="gate-notice-box">
          <div>
            <strong>Authorized Preview Only:</strong> This interactive workstation contains proprietary solver benchmarks. Please enter the credentials provided in your invitation or evaluation package.
          </div>
        </div>

        {/* Login Form */}
        <form className="gate-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="gate-error-banner" role="alert">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="gate-field-group">
            <label className="gate-field-label" htmlFor="gate-username">
              <span>Username</span>
            </label>
            <div className="gate-input-wrapper">
              <input
                id="gate-username"
                type="text"
                autoComplete="username"
                autoFocus
                className="gate-input"
                placeholder="e.g. investor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="gate-field-group">
            <label className="gate-field-label" htmlFor="gate-password">
              <span>Access Password</span>
            </label>
            <div className="gate-input-wrapper">
              <input
                id="gate-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="gate-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="gate-toggle-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="gate-remember-row">
            <label className="gate-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="gate-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Authenticate & Unlock Demonstration</span>
                <span style={{ fontSize: "1.1rem" }}>▶</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Actions */}
        <div className="gate-footer-actions">
          {onClose && (
            <button type="button" className="gate-link-btn gate-back-btn" onClick={onClose}>
              ← Return to Homepage
            </button>
          )}

          {onRequestAccess && (
            <button
              type="button"
              className="gate-link-btn"
              onClick={() => {
                if (onClose) onClose();
                onRequestAccess();
              }}
            >
              Request Evaluator Access ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
