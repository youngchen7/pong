import { useCallback, useEffect, useMemo } from "react";
import { nanoid } from 'nanoid'
import { useCookies } from "react-cookie";
import supabaseClient from "../client";

export function useUserId() {

    const [cookies, setCookie] = useCookies(['user-id'])

    const newUserId = useMemo(() => nanoid(10), [])

    useEffect(() => {
        if (!cookies['user-id']) {
            setCookie('user-id', newUserId)
        }
    }, [cookies, setCookie])

    const resetUserId = useCallback(() => setCookie('user-id', nanoid(10)), [setCookie])

    return [cookies['user-id'] ?? newUserId, resetUserId]
}