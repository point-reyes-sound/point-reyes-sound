import React from "react";

export function checkIsAuthenticated() {
  return true;
}

export function clearAuthentication() {}

export function getAuthenticatedUser() {
  return "public";
}

export default function ExclusiveAccessGate({ children }) {
  return children || null;
}
