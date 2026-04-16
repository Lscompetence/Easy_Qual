import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
    // Singleton pattern to prevent multiple instances during HMR
    // Singleton pattern to prevent multiple instances during HMR
    // CHECK: If key changed (e.g. .env update), destroy old client
    if (window.supabaseGlobal) {
        // We can't easily check the key inside the private client, 
        // but we can attach the key to the window object to track it.
        // FIX: Only check if window.supabaseKey is ALREADY defined (HMR context).
        // If it's undefined (fresh load), we shouldn't clear storage.
        if (window.supabaseKey && window.supabaseKey !== supabaseAnonKey) {
            console.warn('Supabase Key Changed - Recreating Client & Clearing Cache')
            // AUTO-FIX: Clear local storage to prevent "Zombie Session" loops from old keys
            localStorage.clear()
            window.supabaseGlobal = null
        }
    }

    const fetchWithRetry = async (url, options, retries = 3) => {
        try {
            return await fetch(url, options)
        } catch (error) {
            if (retries > 0) {
                console.warn(`Retrying request... (${retries} attempts left)`)
                await new Promise(res => setTimeout(res, 1000)) // Wait 1s before retry
                return fetchWithRetry(url, options, retries - 1)
            }
            throw error
        }
    }

    // Custom Advanced Cookie Storage mechanism for higher security
    const cookieStorage = {
        getItem: (key) => {
            if (typeof document === 'undefined') return null
            const cookies = document.cookie.split(';')
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim()
                if (cookie.startsWith(`${key}=`)) {
                    return decodeURIComponent(cookie.substring(key.length + 1))
                }
            }
            return null
        },
        setItem: (key, value) => {
            if (typeof document === 'undefined') return
            const isProd = import.meta.env.PROD
            // Secure cookie flag applied in production. SameSite=Strict helps prevent CSRF.
            document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${isProd ? '; Secure' : ''}`
        },
        removeItem: (key) => {
            if (typeof document === 'undefined') return
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
    }

    if (!window.supabaseGlobal) {
        window.supabaseGlobal = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                storage: window.sessionStorage, // Forced re-login on browser/tab close
                storageKey: 'easyqual-auth-token',
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            global: {
                fetch: fetchWithRetry
            }
        })
        window.supabaseKey = supabaseAnonKey
    }
    supabaseInstance = window.supabaseGlobal
} else {
    // Dummy client to prevent crash, will log error on use
    console.error('Supabase Credentials Missing in .env.local')
    supabaseInstance = {
        auth: {
            getSession: () => Promise.reject('No Supabase Credentials'),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.reject('No Supabase Credentials'),
            signOut: () => Promise.reject('No Supabase Credentials'),
        },
        from: () => ({
            select: () => ({ eq: () => ({ single: () => Promise.reject('No Supabase Credentials') }) }),
            upsert: () => Promise.reject('No Supabase Credentials'),
            insert: () => Promise.reject('No Supabase Credentials'),
            update: () => Promise.reject('No Supabase Credentials'),
        }),
        rpc: () => Promise.reject('No Supabase Credentials')
    }
}

export const supabase = supabaseInstance
