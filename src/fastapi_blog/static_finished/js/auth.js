/**
 * Client-side session handling for the FastAPI Blog.
 *
 * The backend issues a bearer JWT from POST /api/users/token. This module
 * stores it, attaches it to API requests, keeps the navigation in sync and
 * reveals owner-only UI (edit/delete buttons, drafts, profile actions).
 */
(function () {
    "use strict";

    const TOKEN_KEY = "access_token";
    const TOKEN_TYPE_KEY = "token_type";
    const USER_KEY = "current_user";
    const LOGIN_PATH = "/login";
    const DEFAULT_AVATAR = "/static/icons/writer.svg";

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getTokenType() {
        return localStorage.getItem(TOKEN_TYPE_KEY) || "Bearer";
    }

    function getUser() {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function saveToken(tokenData) {
        if (!tokenData || !tokenData.access_token) return;
        localStorage.setItem(TOKEN_KEY, tokenData.access_token);
        localStorage.setItem(TOKEN_TYPE_KEY, tokenData.token_type || "Bearer");
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_TYPE_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function currentPath() {
        return window.location.pathname + window.location.search;
    }

    function loginUrl(next, reason) {
        const params = new URLSearchParams();
        params.set("next", next || currentPath());
        if (reason) params.set("reason", reason);
        return `${LOGIN_PATH}?${params.toString()}`;
    }

    function redirectToLogin(next, reason) {
        if (window.location.pathname === LOGIN_PATH) return;
        window.location.href = loginUrl(next, reason);
    }

    /**
     * Clear the expired/invalid session and send the user back to the login
     * page, remembering where they were.
     */
    function handleUnauthorized() {
        clearSession();
        applyUser(null);
        redirectToLogin(currentPath(), "session_expired");
    }

    /**
     * fetch() wrapper that adds the Authorization header.
     */
    async function apiFetch(input, init = {}) {
        const headers = new Headers(init.headers || {});
        const token = getToken();
        if (token) {
            headers.set("Authorization", `${getTokenType()} ${token}`);
        }
        if (!headers.has("Accept")) {
            headers.set("Accept", "application/json");
        }
        return fetch(input, { ...init, headers });
    }

    /**
     * Apply an authenticated user to the whole document.
     */
    function applyUser(user) {
        const authenticated = Boolean(user);
        document.documentElement.dataset.authState = authenticated ? "authenticated" : "guest";
        window.currentUser = user || null;

        if (authenticated) {
            document.querySelectorAll('[data-user-field="username"]').forEach((el) => {
                el.textContent = user.username || "Account";
            });
            document.querySelectorAll('[data-user-field="email"]').forEach((el) => {
                el.textContent = user.email || "";
            });

            const avatar = document.getElementById("nav-user-avatar");
            if (avatar) {
                avatar.src = user.image_path || DEFAULT_AVATAR;
                avatar.alt = `${user.username}'s avatar`;
            }

            const userPostsHref = `/users/${user.id}/posts`;
            const myPostsLink = document.getElementById("menu-my-posts");
            if (myPostsLink) myPostsLink.href = userPostsHref;
            const profileLink = document.getElementById("menu-profile");
            if (profileLink) profileLink.href = userPostsHref;
        }

        // Owner-only elements: <div data-owner-id="5" data-owner-display="flex">
        document.querySelectorAll("[data-owner-id]").forEach((el) => {
            const isOwner =
                authenticated && String(user.id) === String(el.dataset.ownerId);
            el.style.display = isOwner ? el.dataset.ownerDisplay || "" : "none";
        });

        // Draft post page: show a placeholder instead of the article content.
        const draftNotice = document.getElementById("draft-private-notice");
        if (draftNotice) {
            const isAuthor =
                authenticated &&
                String(user.id) === String(draftNotice.dataset.authorId);
            draftNotice.style.display = isAuthor ? "none" : "block";
        }

        refreshPostLists();

        document.dispatchEvent(
            new CustomEvent("auth:changed", { detail: { user: user || null } })
        );
    }

    /**
     * Show a list's empty state when every card is hidden (e.g. a guest
     * looking at a list that only contains drafts).
     */
    function refreshPostLists() {
        document.querySelectorAll("[data-post-list]").forEach((list) => {
            const empty = document.querySelector(
                `[data-post-empty-for="${list.id}"]`
            );
            if (!empty) return;

            const visibleCards = Array.from(
                list.querySelectorAll("article")
            ).filter(
                (el) =>
                    el.style.display !== "none" &&
                    !el.classList.contains("hidden")
            );

            empty.style.display = visibleCards.length ? "none" : "";

            const count = visibleCards.length;
            const articleLabel = count === 1 ? "article" : "articles";

            const homeCount = document.getElementById("home-article-count");
            if (homeCount && list.id === "home-post-list") {
                homeCount.textContent = `${count} ${articleLabel}`;
            }

            const profileCount = document.getElementById("profile-article-count");
            if (profileCount && list.id === "profile-post-list") {
                profileCount.textContent = `${count} ${articleLabel}`;
            }

            const profileTotal = document.getElementById("profile-total-count");
            if (profileTotal && list.id === "profile-post-list") {
                profileTotal.textContent = `${count} total`;
            }
        });
    }

    function setUser(user) {
        if (!user) return;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        applyUser(user);
    }

    async function refreshUser() {
        if (!getToken()) {
            applyUser(null);
            return null;
        }

        // Paint from cache first so the header does not jump around.
        const cached = getUser();
        if (cached) applyUser(cached);

        try {
            const response = await apiFetch("/api/users/me", {
                headers: { Accept: "application/json" }
            });

            if (response.status === 401) {
                clearSession();
                applyUser(null);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Failed to load current user (${response.status})`);
            }

            const user = await response.json();
            setUser(user);
            return user;
        } catch (error) {
            // Network hiccup: keep the cached session rather than logging out.
            if (window.console) console.warn("Could not refresh current user:", error);
            applyUser(cached);
            return cached;
        }
    }

    function bindUserMenu() {
        const button = document.getElementById("user-menu-btn");
        const menu = document.getElementById("user-menu");
        if (!button || !menu) return;

        const closeMenu = () => {
            menu.classList.add("hidden");
            button.setAttribute("aria-expanded", "false");
        };

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = !menu.classList.contains("hidden");
            if (isOpen) {
                closeMenu();
            } else {
                menu.classList.remove("hidden");
                button.setAttribute("aria-expanded", "true");
            }
        });

        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target) && !button.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMenu();
        });

        const logoutBtn = document.getElementById("menu-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }
    }

    function logout() {
        clearSession();
        applyUser(null);
        window.location.href = "/";
    }

    function requireAuth(next) {
        if (!getToken()) {
            redirectToLogin(next);
            return false;
        }
        return true;
    }

    const Auth = {
        getToken,
        getTokenType,
        getUser,
        setUser,
        saveToken,
        clearSession,
        apiFetch,
        refreshUser,
        applyUser,
        logout,
        requireAuth,
        redirectToLogin,
        handleUnauthorized,
        loginUrl,
        refreshPostLists,
        ready: null
    };

    let resolveReady;
    Auth.ready = new Promise((resolve) => {
        resolveReady = resolve;
    });

    function init() {
        bindUserMenu();
        if (!getToken()) {
            applyUser(null);
            return Promise.resolve(null);
        }
        return refreshUser();
    }

    const start = () => {
        init()
            .then((user) => resolveReady(user))
            .catch(() => {
                applyUser(null);
                resolveReady(null);
            });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.Auth = Auth;
})();
