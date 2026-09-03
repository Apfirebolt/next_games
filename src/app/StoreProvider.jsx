"use client";

import { useRef, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { SessionProvider, useSession } from "next-auth/react";
import { makeStore } from "../store";

// Syncs NextAuth Google session into Redux state
function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !currentUser) {
      dispatch({
        type: "auth/setCredentials", // Or your slice action e.g., setCredentials(session.user)
        payload: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isAdmin: session.user.isAdmin ?? false,
          token: session.user.token ?? null,
        },
      });
    }
  }, [session, status, currentUser, dispatch]);

  return null;
}

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

  return (
    <SessionProvider>
      <Provider store={storeRef.current}>
        <AuthSync />
        {children}
      </Provider>
    </SessionProvider>
  );
}