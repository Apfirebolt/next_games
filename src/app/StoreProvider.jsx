"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore } from "../store";

export default function StoreProvider({ children, initialUser = null }) {
  const storeRef = useRef(null);

  if (!storeRef.current) {
    storeRef.current = makeStore({
      auth: {
        user: initialUser,
        profile: null,
        isError: false,
        isSuccess: false,
        isLoading: false,
        message: "",
      },
    });
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}