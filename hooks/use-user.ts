import { useCallback, useEffect, useState } from "react";
import supabaseClient from "../client";
import { User } from "@supabase/supabase-js";

const signIn = async ({ onSuccess, onError }:
    { onSuccess?: (user: User) => void, onError?: () => void }) => {

    // First check if we're already signed in.
    const user = await supabaseClient.auth.getUser()
    if (user.data.user) {
        onSuccess?.(user.data.user)
        return
    }

    const response = await supabaseClient.auth.signInAnonymously()
    if (response.data?.user) {
        onSuccess?.(response.data.user)
    } else {
        onError?.()
    }
}

export function useUser() {

    const [user, setUser] = useState<User>()

    useEffect(() => {
        if (!user) {
            signIn({ onSuccess: setUser })
        }
    }, [user, setUser])

    const signOut = useCallback(async () => {
        await supabaseClient.auth.signOut()
        setUser(undefined)
    }, [])

    return { user, signOut }
}