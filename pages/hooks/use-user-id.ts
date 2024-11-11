import { useEffect, useMemo } from "react";
import { nanoid } from 'nanoid'
import { useCookies } from "react-cookie";

export function useUserId() {
    const [cookies, setCookie] = useCookies(['user-id'])

    const newUserId = useMemo(nanoid, [])

    useEffect(() => {
        if (!cookies['user-id']) {
            setCookie('user-id', newUserId)
        }
    }, [cookies, setCookie])

    return cookies['user-id'] ?? newUserId
}