/**
 * Dedicated account page (/account).
 *
 * Backend support today:
 *   - GET    /api/users/me           -> profile
 *   - PATCH  /api/users/{id}         -> username, email
 *   - PATCH  /api/users/{id}/picture -> upload avatar
 *   - DELETE /api/users/{id}/picture -> remove avatar
 *   - DELETE /api/users/{id}         -> delete account (posts cascade)
 *   - GET    /api/users/{id}/posts   -> post/draft counts
 *
 * Not available in the API yet (UI kept, deliberately not faked):
 *   - password change
 */
document.addEventListener("DOMContentLoaded", () => {
    const page = document.getElementById("account-page");
    if (!page) return;

    const { openModal, closeModal, extractApiErrors, toast } = window.UI || {};
    const DEFAULT_AVATAR = "/static/icons/writer.svg";
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

    // ------------------------------------------------------------
    // State / loading elements
    // ------------------------------------------------------------
    const loading = document.getElementById("account-loading");
    const loadError = document.getElementById("account-load-error");
    const loadErrorMessage = document.getElementById("account-load-error-message");
    const retryButton = document.getElementById("account-retry-btn");

    let currentUser = null;
    let avatarObjectUrl = null;
    let selectedAvatarFile = null;

    // ------------------------------------------------------------
    // Header / identity
    // ------------------------------------------------------------
    const avatarImage = document.getElementById("account-avatar");
    const displayName = document.getElementById("account-display-name");
    const displayEmail = document.getElementById("account-display-email");
    const accountId = document.getElementById("account-id");
    const postCount = document.getElementById("account-post-count");
    const draftCount = document.getElementById("account-draft-count");
    const sessionUsername = document.getElementById("session-username");

    // ------------------------------------------------------------
    // Profile section
    // ------------------------------------------------------------
    const profileForm = document.getElementById("profile-form");
    const usernameInput = document.getElementById("account-username");
    const emailInput = document.getElementById("account-email");
    const profileSaveButton = document.getElementById("profile-save-btn");
    const profileSaveText = document.getElementById("profile-save-text");
    const profileAlert = document.getElementById("profile-alert");
    const profileAlertMessage = document.getElementById("profile-alert-message");

    // ------------------------------------------------------------
    // Password section
    // ------------------------------------------------------------
    const passwordForm = document.getElementById("password-form");
    const currentPasswordInput = document.getElementById("current-password");
    const newPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-new-password");
    const passwordStrengthLabel = document.getElementById("password-strength-label");
    const strengthSegments = document.querySelectorAll(".password-strength-segment");
    const passwordAlert = document.getElementById("password-alert");
    const passwordAlertMessage = document.getElementById("password-alert-message");

    // ------------------------------------------------------------
    // Avatar section
    // ------------------------------------------------------------
    const avatarPreview = document.getElementById("account-avatar-preview");
    const avatarInput = document.getElementById("avatar-file");
    const avatarDropzone = document.getElementById("avatar-dropzone");
    const avatarFileName = document.getElementById("avatar-file-name");
    const avatarAlert = document.getElementById("avatar-alert");
    const avatarAlertMessage = document.getElementById("avatar-alert-message");
    const avatarResetButton = document.getElementById("avatar-reset-btn");
    const avatarSaveButton = document.getElementById("avatar-save-btn");
    const avatarSaveText = document.getElementById("avatar-save-text");
    const avatarDeleteButton = document.getElementById("avatar-delete-btn");
    const avatarDeleteText = document.getElementById("avatar-delete-text");

    // ------------------------------------------------------------
    // Session / danger zone
    // ------------------------------------------------------------
    const logoutButtons = [
        document.getElementById("account-logout"),
        document.getElementById("account-logout-2")
    ].filter(Boolean);

    const deleteButton = document.getElementById("account-delete-btn");
    const deleteModal = document.getElementById("account-delete-modal");
    const deleteName = document.getElementById("account-delete-name");
    const deleteConfirmInput = document.getElementById("account-delete-confirm-input");
    const deleteConfirmButton = document.getElementById("account-delete-confirm");
    const deleteConfirmText = document.getElementById("account-delete-confirm-text");
    const deleteCancelButton = document.getElementById("account-delete-cancel");
    const deleteError = document.getElementById("account-delete-error");
    const deleteErrorMessage = document.getElementById("account-delete-error-message");

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    function setHidden(el, hidden) {
        if (!el) return;
        el.classList.toggle("hidden", hidden);
    }

    function clearAlert(alertEl, messageEl) {
        if (!alertEl) return;
        alertEl.classList.add("hidden");
        if (messageEl) messageEl.innerHTML = "";
    }

    function showAlert(alertEl, messageEl, messages) {
        if (!alertEl || !messageEl) return;

        messageEl.innerHTML = "";
        const list = Array.isArray(messages) ? messages : [messages];

        if (list.length === 1) {
            messageEl.textContent = list[0];
        } else {
            const ul = document.createElement("ul");
            ul.className = "list-disc list-inside space-y-1";
            list.forEach((message) => {
                const li = document.createElement("li");
                li.textContent = message;
                ul.appendChild(li);
            });
            messageEl.appendChild(ul);
        }

        alertEl.classList.remove("hidden");
        if (window.lucide) window.lucide.createIcons();
    }

    async function readErrorPayload(response) {
        try {
            return await response.json();
        } catch {
            return {
                detail: `Server error (${response.status} ${response.statusText})`
            };
        }
    }

    function errorMessages(payload, status) {
        return extractApiErrors(payload, status).map((error) =>
            error.field ? `${error.field}: ${error.message}` : error.message
        );
    }

    function setIdentity(user) {
        if (displayName) displayName.textContent = user.username || "Account settings";
        if (displayEmail) displayEmail.textContent = user.email || "";
        if (accountId) accountId.textContent = `#${user.id}`;
        if (sessionUsername) sessionUsername.textContent = user.username || "";
        if (usernameInput) usernameInput.value = user.username || "";
        if (emailInput) emailInput.value = user.email || "";
        setAvatar(user.image_path || DEFAULT_AVATAR);
        updateAvatarUIState();
    }

    function setAvatar(src) {
        if (avatarImage) avatarImage.src = src;
        if (avatarPreview && !avatarObjectUrl) avatarPreview.src = src;
        const navAvatar = document.getElementById("nav-user-avatar");
        if (navAvatar) navAvatar.src = src;
    }

    function handleUnauthorizedIfNeeded(status) {
        if (status !== 401) return false;
        if (window.Auth) window.Auth.handleUnauthorized();
        return true;
    }

    // ------------------------------------------------------------
    // Load account
    // ------------------------------------------------------------
    async function loadStats(userId) {
        try {
            const response = await window.Auth.apiFetch(
                `/api/users/${userId}/posts`,
                { headers: { Accept: "application/json" } }
            );
            if (!response.ok) return;

            const posts = await response.json();
            const drafts = posts.filter((post) => !post.published).length;
            const published = posts.length - drafts;

            if (postCount) {
                postCount.textContent = String(published);
                postCount.title = `${posts.length} total`;
            }
            if (draftCount) draftCount.textContent = String(drafts);
        } catch {
            // Counts are cosmetic; leave the placeholders if this fails.
        }
    }

    async function loadAccount() {
        setHidden(loadError, true);
        setHidden(page, true);
        setHidden(loading, false);

        try {
            const user = window.Auth ? await window.Auth.ready : null;

            if (!user) {
                window.location.replace("/login?next=%2Faccount");
                return;
            }

            currentUser = user;
            setIdentity(user);

            setHidden(loading, true);
            setHidden(page, false);
            if (window.lucide) window.lucide.createIcons();

            loadStats(user.id);
        } catch (error) {
            setHidden(loading, true);
            if (loadErrorMessage) {
                loadErrorMessage.textContent =
                    error.message || "Something went wrong while fetching your profile.";
            }
            setHidden(loadError, false);
            if (window.lucide) window.lucide.createIcons();
        }
    }

    if (retryButton) {
        retryButton.addEventListener("click", () => window.location.reload());
    }

    // ------------------------------------------------------------
    // Profile details (PATCH /api/users/{id})
    // ------------------------------------------------------------
    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearAlert(profileAlert, profileAlertMessage);

            if (!currentUser) return;

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();

            if (!username) {
                showAlert(profileAlert, profileAlertMessage, "Username is required.");
                usernameInput.focus();
                return;
            }
            if (username.length > 50) {
                showAlert(profileAlert, profileAlertMessage, "Username must be 50 characters or fewer.");
                usernameInput.focus();
                return;
            }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showAlert(profileAlert, profileAlertMessage, "Enter a valid email address.");
                emailInput.focus();
                return;
            }
            if (email.length > 120) {
                showAlert(profileAlert, profileAlertMessage, "Email must be 120 characters or fewer.");
                emailInput.focus();
                return;
            }

            if (username === currentUser.username && email === currentUser.email) {
                toast("Nothing to update.");
                return;
            }

            profileSaveButton.disabled = true;
            profileSaveText.textContent = "Saving...";

            try {
                const response = await window.Auth.apiFetch(`/api/users/${currentUser.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email })
                });

                if (handleUnauthorizedIfNeeded(response.status)) return;

                if (!response.ok) {
                    showAlert(
                        profileAlert,
                        profileAlertMessage,
                        errorMessages(await readErrorPayload(response), response.status)
                    );
                    return;
                }

                const updatedUser = await response.json();
                currentUser = updatedUser;
                window.Auth.setUser(updatedUser);
                setIdentity(updatedUser);
                clearAlert(profileAlert, profileAlertMessage);
                toast("Profile updated successfully.");
            } catch (error) {
                showAlert(
                    profileAlert,
                    profileAlertMessage,
                    error.message || "Could not update your profile."
                );
            } finally {
                profileSaveButton.disabled = false;
                profileSaveText.textContent = "Save changes";
            }
        });
    }

    // ------------------------------------------------------------
    // Password (frontend-only until the API gains an endpoint)
    // ------------------------------------------------------------
    function passwordScore(value) {
        let score = 0;
        if (value.length >= 8) score += 1;
        if (value.length >= 12) score += 1;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
        if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
        return Math.min(score, 4);
    }

    function renderPasswordStrength(value) {
        const score = value ? passwordScore(value) : 0;
        const labels = ["—", "Weak", "Fair", "Good", "Strong"];
        const colors = ["", "#dc2626", "#d97706", "#0891b2", "#059669"];

        if (passwordStrengthLabel) {
            passwordStrengthLabel.textContent = labels[score];
            passwordStrengthLabel.style.color = colors[score] || "";
        }

        strengthSegments.forEach((segment, index) => {
            segment.style.backgroundColor = index < score ? colors[score] : "";
        });
    }

    if (newPasswordInput) {
        newPasswordInput.addEventListener("input", () => {
            renderPasswordStrength(newPasswordInput.value);
        });
    }

    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.togglePassword);
            if (!input) return;
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.textContent = show ? "Hide" : "Show";
        });
    });

    if (passwordForm) {
        passwordForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearAlert(passwordAlert, passwordAlertMessage);

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!currentPassword) {
                showAlert(passwordAlert, passwordAlertMessage, "Enter your current password.");
                currentPasswordInput.focus();
                return;
            }
            if (newPassword.length < 8) {
                showAlert(passwordAlert, passwordAlertMessage, "The new password must be at least 8 characters long.");
                newPasswordInput.focus();
                return;
            }
            if (newPassword !== confirmPassword) {
                showAlert(passwordAlert, passwordAlertMessage, "The new passwords do not match.");
                confirmPasswordInput.focus();
                return;
            }
            if (newPassword === currentPassword) {
                showAlert(passwordAlert, passwordAlertMessage, "The new password must be different from the current one.");
                newPasswordInput.focus();
                return;
            }

            // TODO: call the password-change endpoint here once the backend adds one.
            showAlert(
                passwordAlert,
                passwordAlertMessage,
                "Nothing was saved: the API does not expose a password-change endpoint yet. " +
                    "Your current password is still active."
            );
        });
    }

    // ------------------------------------------------------------
    // Avatar (upload & delete via /api/users/{id}/picture)
    // ------------------------------------------------------------
    function isImageFile(file) {
        if (!file) return false;
        if (file.type && file.type.startsWith("image/")) return true;
        const name = (file.name || "").toLowerCase();
        return /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico|jfif)$/i.test(name);
    }

    function updateAvatarUIState() {
        const hasCustomAvatar = Boolean(currentUser && currentUser.image_file);
        if (avatarDeleteButton) {
            avatarDeleteButton.classList.toggle("hidden", !hasCustomAvatar);
        }

        const hasSelectedFile = Boolean(selectedAvatarFile);
        if (avatarResetButton) {
            avatarResetButton.classList.toggle("hidden", !hasSelectedFile);
        }
        if (avatarSaveButton) {
            avatarSaveButton.disabled = !hasSelectedFile;
            if (hasSelectedFile) {
                avatarSaveButton.removeAttribute("disabled");
                avatarSaveButton.classList.remove("opacity-50", "cursor-not-allowed");
            } else {
                avatarSaveButton.setAttribute("disabled", "true");
                avatarSaveButton.classList.add("opacity-50", "cursor-not-allowed");
            }
        }
    }

    function clearAvatarPreview() {
        if (avatarObjectUrl) {
            URL.revokeObjectURL(avatarObjectUrl);
            avatarObjectUrl = null;
        }
        selectedAvatarFile = null;
        if (avatarPreview) {
            avatarPreview.src = currentUser?.image_path || DEFAULT_AVATAR;
        }
        if (avatarInput) avatarInput.value = "";
        if (avatarFileName) avatarFileName.textContent = "";
        updateAvatarUIState();
    }

    function handleAvatarFile(file) {
        clearAlert(avatarAlert, avatarAlertMessage);

        if (!file) return;
        if (!isImageFile(file)) {
            clearAvatarPreview();
            showAlert(avatarAlert, avatarAlertMessage, "Please choose an image file (PNG, JPG, WebP, GIF, etc.).");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            clearAvatarPreview();
            showAlert(avatarAlert, avatarAlertMessage, "The image must be 5 MB or smaller.");
            return;
        }

        selectedAvatarFile = file;

        if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = URL.createObjectURL(file);

        if (avatarPreview) avatarPreview.src = avatarObjectUrl;
        if (avatarFileName) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
            const sizeText = file.size >= 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
            avatarFileName.textContent = `${file.name} · ${sizeText}`;
        }
        clearAlert(avatarAlert, avatarAlertMessage);
        updateAvatarUIState();
    }

    if (avatarInput) {
        const onAvatarChange = () => {
            const file = avatarInput.files && avatarInput.files[0];
            if (file) handleAvatarFile(file);
        };
        avatarInput.addEventListener("change", onAvatarChange);
        avatarInput.addEventListener("input", onAvatarChange);
    }

    if (avatarDropzone) {
        const activeClasses = ["border-navy-900", "dark:border-cream-100", "bg-navy-900/5", "dark:bg-navy-700/30"];

        ["dragenter", "dragover"].forEach((eventName) => {
            avatarDropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
                avatarDropzone.classList.add(...activeClasses);
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            avatarDropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
                avatarDropzone.classList.remove(...activeClasses);
            });
        });

        avatarDropzone.addEventListener("drop", (event) => {
            const file = event.dataTransfer?.files?.[0];
            if (file) {
                try {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    if (avatarInput) avatarInput.files = dt.files;
                } catch {
                    // Ignore DataTransfer construction fallback
                }
                handleAvatarFile(file);
            }
        });
    }

    if (avatarResetButton) {
        avatarResetButton.addEventListener("click", () => {
            clearAvatarPreview();
            clearAlert(avatarAlert, avatarAlertMessage);
        });
    }

    if (avatarSaveButton) {
        avatarSaveButton.addEventListener("click", async () => {
            clearAlert(avatarAlert, avatarAlertMessage);

            if (!selectedAvatarFile) {
                showAlert(avatarAlert, avatarAlertMessage, "Choose an image first.");
                return;
            }
            if (!currentUser) return;

            avatarSaveButton.disabled = true;
            if (avatarSaveText) avatarSaveText.textContent = "Uploading...";
            if (avatarResetButton) avatarResetButton.disabled = true;
            if (avatarDeleteButton) avatarDeleteButton.disabled = true;

            try {
                const formData = new FormData();
                formData.append("file", selectedAvatarFile);

                const response = await window.Auth.apiFetch(
                    `/api/users/${currentUser.id}/picture`,
                    {
                        method: "PATCH",
                        body: formData
                    }
                );

                if (handleUnauthorizedIfNeeded(response.status)) return;

                if (!response.ok) {
                    const errPayload = await readErrorPayload(response);
                    showAlert(
                        avatarAlert,
                        avatarAlertMessage,
                        errorMessages(errPayload, response.status)
                    );
                    return;
                }

                const updatedUser = await response.json();
                currentUser = updatedUser;
                window.Auth.setUser(updatedUser);

                clearAvatarPreview();
                setIdentity(updatedUser);
                clearAlert(avatarAlert, avatarAlertMessage);
                if (toast) toast("Avatar updated successfully.");
            } catch (error) {
                showAlert(
                    avatarAlert,
                    avatarAlertMessage,
                    error.message || "Could not upload avatar."
                );
            } finally {
                avatarSaveButton.disabled = !selectedAvatarFile;
                if (avatarSaveText) avatarSaveText.textContent = "Save avatar";
                if (avatarResetButton) avatarResetButton.disabled = false;
                if (avatarDeleteButton) avatarDeleteButton.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    if (avatarDeleteButton) {
        avatarDeleteButton.addEventListener("click", async () => {
            clearAlert(avatarAlert, avatarAlertMessage);

            if (!currentUser || !currentUser.image_file) return;

            if (!window.confirm("Are you sure you want to remove your avatar?")) {
                return;
            }

            avatarDeleteButton.disabled = true;
            if (avatarDeleteText) avatarDeleteText.textContent = "Removing...";
            if (avatarSaveButton) avatarSaveButton.disabled = true;
            if (avatarResetButton) avatarResetButton.disabled = true;

            try {
                const response = await window.Auth.apiFetch(
                    `/api/users/${currentUser.id}/picture`,
                    {
                        method: "DELETE"
                    }
                );

                if (handleUnauthorizedIfNeeded(response.status)) return;

                if (!response.ok) {
                    const errPayload = await readErrorPayload(response);
                    showAlert(
                        avatarAlert,
                        avatarAlertMessage,
                        errorMessages(errPayload, response.status)
                    );
                    return;
                }

                const updatedUser = await response.json();
                currentUser = updatedUser;
                window.Auth.setUser(updatedUser);

                clearAvatarPreview();
                setIdentity(updatedUser);
                clearAlert(avatarAlert, avatarAlertMessage);
                if (toast) toast("Avatar removed.");
            } catch (error) {
                showAlert(
                    avatarAlert,
                    avatarAlertMessage,
                    error.message || "Could not remove avatar."
                );
            } finally {
                avatarDeleteButton.disabled = false;
                if (avatarDeleteText) avatarDeleteText.textContent = "Remove avatar";
                updateAvatarUIState();
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    // ------------------------------------------------------------
    // Logout
    // ------------------------------------------------------------
    logoutButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (window.Auth) window.Auth.logout();
        });
    });

    // ------------------------------------------------------------
    // Delete account (DELETE /api/users/{id})
    // ------------------------------------------------------------
    function clearDeleteError() {
        if (!deleteError) return;
        deleteError.classList.add("hidden");
        if (deleteErrorMessage) deleteErrorMessage.innerHTML = "";
    }

    function openDeleteModal() {
        if (!deleteModal || !currentUser) return;

        if (deleteName) deleteName.textContent = currentUser.username;
        if (deleteConfirmInput) deleteConfirmInput.value = "";
        if (deleteConfirmButton) deleteConfirmButton.disabled = true;
        clearDeleteError();
        openModal(deleteModal);

        if (deleteConfirmInput) {
            setTimeout(() => deleteConfirmInput.focus(), 80);
        }
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", openDeleteModal);
    }

    if (deleteConfirmInput) {
        deleteConfirmInput.addEventListener("input", () => {
            if (!deleteConfirmButton || !currentUser) return;
            deleteConfirmButton.disabled =
                deleteConfirmInput.value.trim() !== currentUser.username;
        });
    }

    if (deleteCancelButton) {
        deleteCancelButton.addEventListener("click", () => closeModal(deleteModal));
    }

    if (deleteModal) {
        deleteModal.addEventListener("click", (event) => {
            if (event.target === deleteModal) closeModal(deleteModal);
        });
    }

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            deleteModal &&
            !deleteModal.classList.contains("opacity-0")
        ) {
            closeModal(deleteModal);
        }
    });

    if (deleteConfirmButton) {
        deleteConfirmButton.addEventListener("click", async () => {
            if (!currentUser) return;
            if (
                !deleteConfirmInput ||
                deleteConfirmInput.value.trim() !== currentUser.username
            ) {
                return;
            }

            deleteConfirmButton.disabled = true;
            deleteConfirmText.textContent = "Deleting…";
            clearDeleteError();

            try {
                const response = await window.Auth.apiFetch(`/api/users/${currentUser.id}`, {
                    method: "DELETE"
                });

                if (handleUnauthorizedIfNeeded(response.status)) return;

                if (!response.ok && response.status !== 204) {
                    const messages = errorMessages(
                        await readErrorPayload(response),
                        response.status
                    );
                    if (deleteError && deleteErrorMessage) {
                        deleteErrorMessage.textContent =
                            messages.join(" ") || "Could not delete your account.";
                        deleteError.classList.remove("hidden");
                        if (window.lucide) window.lucide.createIcons();
                    }
                    return;
                }

                closeModal(deleteModal);
                window.Auth.logout();
            } catch (error) {
                if (deleteError && deleteErrorMessage) {
                    deleteErrorMessage.textContent =
                        error.message || "Could not delete your account.";
                    deleteError.classList.remove("hidden");
                }
            } finally {
                deleteConfirmButton.disabled = false;
                deleteConfirmText.textContent = "Delete account";
            }
        });
    }

    // ------------------------------------------------------------
    // Go
    // ------------------------------------------------------------
    loadAccount();
});
