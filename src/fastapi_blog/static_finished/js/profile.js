/**
 * Profile page actions: edit account details and delete the account.
 *
 * The profile itself is rendered by the server at /users/{id}/posts; these
 * controls are only revealed for the logged-in owner.
 */
document.addEventListener("DOMContentLoaded", () => {
    const { openModal, closeModal, extractApiErrors, showErrors, toast } = window.UI || {};

    const editButton = document.getElementById("edit-profile-btn");
    const deleteButton = document.getElementById("delete-account-btn");
    if (!editButton && !deleteButton) return;

    const editModal = document.getElementById("edit-profile-modal");
    const editForm = document.getElementById("edit-profile-form");
    const usernameInput = document.getElementById("edit-profile-username");
    const emailInput = document.getElementById("edit-profile-email");
    const editSubmitBtn = document.getElementById("edit-profile-submit");
    const editSubmitText = document.getElementById("edit-profile-submit-text");
    const editErrorAlert = document.getElementById("edit-profile-error");
    const editErrorMessage = document.getElementById("edit-profile-error-message");

    const deleteModal = document.getElementById("delete-account-modal");
    const deleteUsername = document.getElementById("delete-account-username");
    const cancelDeleteBtn = document.getElementById("cancel-delete-account-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-account-btn");
    const deleteSubmitText = document.getElementById("delete-account-confirm-text");

    const cancelEditBtn = document.getElementById("cancel-edit-profile-btn");
    const closeEditXBtn = document.getElementById("close-edit-profile-x-btn");

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => closeModal(editModal));
    }
    if (closeEditXBtn) {
        closeEditXBtn.addEventListener("click", () => closeModal(editModal));
    }
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", () => closeModal(deleteModal));
    }

    [editModal, deleteModal].forEach((modal) => {
        if (!modal) return;
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (deleteModal && !deleteModal.classList.contains("opacity-0")) {
            closeModal(deleteModal);
        } else if (editModal && !editModal.classList.contains("opacity-0")) {
            closeModal(editModal);
        }
    });

    function pageUserId() {
        const raw = editButton?.dataset.userId || deleteButton?.dataset.userId;
        return raw ? Number(raw) : null;
    }

    function clearEditError() {
        if (!editErrorAlert) return;
        editErrorAlert.classList.add("hidden");
        if (editErrorMessage) editErrorMessage.innerHTML = "";
    }

    function showEditError(messages) {
        if (!editErrorAlert || !editErrorMessage) return;
        editErrorMessage.innerHTML = "";

        if (Array.isArray(messages)) {
            const ul = document.createElement("ul");
            ul.className = "list-disc list-inside space-y-1";
            messages.forEach((message) => {
                const li = document.createElement("li");
                li.textContent = message;
                ul.appendChild(li);
            });
            editErrorMessage.appendChild(ul);
        } else {
            editErrorMessage.textContent = messages;
        }

        editErrorAlert.classList.remove("hidden");
        if (window.lucide) window.lucide.createIcons();
    }

    function updatePageUser(user) {
        document.querySelectorAll(".profile-username").forEach((el) => {
            el.textContent = user.username;
        });
        document.querySelectorAll(".profile-email").forEach((el) => {
            el.textContent = user.email;
        });
        document.querySelectorAll(".profile-avatar").forEach((img) => {
            img.src = user.image_path || "/static/icons/writer.svg";
            img.alt = `${user.username}'s avatar`;
        });
    }

    async function currentUser() {
        const user = window.Auth ? await window.Auth.ready : null;
        if (!user && window.Auth) window.Auth.redirectToLogin();
        return user;
    }

    function isOwnProfile(user) {
        const pageId = pageUserId();
        return user && (!pageId || user.id === pageId);
    }

    // The server never renders the account email; fill it in only for the
    // owner, straight from GET /api/users/me.
    if (window.Auth) {
        window.Auth.ready.then((user) => {
            if (user && isOwnProfile(user)) updatePageUser(user);
        });
    }

    // --------------------------------------------------------
    // Edit profile
    // --------------------------------------------------------
    if (editButton) {
        editButton.addEventListener("click", async () => {
            const user = await currentUser();
            if (!user || !isOwnProfile(user)) return;

            if (usernameInput) usernameInput.value = user.username || "";
            if (emailInput) emailInput.value = user.email || "";
            clearEditError();
            openModal(editModal);
            if (usernameInput) setTimeout(() => usernameInput.focus(), 60);
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearEditError();

            const user = await currentUser();
            if (!user) return;

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();

            if (!username || !email) {
                showEditError("Username and email are required.");
                return;
            }

            if (editSubmitBtn) {
                editSubmitBtn.disabled = true;
                if (editSubmitText) editSubmitText.textContent = "Saving...";
            }

            try {
                const response = await window.Auth.apiFetch(`/api/users/${user.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email })
                });

                if (response.status === 401) {
                    window.Auth.handleUnauthorized();
                    return;
                }

                if (!response.ok) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = { detail: `Server error (${response.status})` };
                    }

                    const errors = extractApiErrors(errJson, response.status);
                    showEditError(errors.map((item) => item.message));
                    return;
                }

                const updatedUser = await response.json();
                window.Auth.setUser(updatedUser);
                updatePageUser(updatedUser);
                closeModal(editModal);
                toast("Profile updated successfully.");
            } catch (err) {
                showEditError(err.message || "Could not update your profile.");
            } finally {
                if (editSubmitBtn) {
                    editSubmitBtn.disabled = false;
                    if (editSubmitText) editSubmitText.textContent = "Save Changes";
                }
            }
        });
    }

    // --------------------------------------------------------
    // Delete account
    // --------------------------------------------------------
    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const user = await currentUser();
            if (!user || !isOwnProfile(user)) return;

            if (deleteUsername) deleteUsername.textContent = user.username;
            openModal(deleteModal);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            const user = await currentUser();
            if (!user) return;

            confirmDeleteBtn.disabled = true;
            if (deleteSubmitText) deleteSubmitText.textContent = "Deleting...";

            try {
                const response = await window.Auth.apiFetch(`/api/users/${user.id}`, {
                    method: "DELETE"
                });

                if (response.status === 401) {
                    window.Auth.handleUnauthorized();
                    return;
                }

                if (!response.ok && response.status !== 204) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = { detail: `Server error (${response.status})` };
                    }
                    showErrors(extractApiErrors(errJson, response.status), {
                        title: "Could Not Delete Account",
                        closeLabel: "Close"
                    });
                    return;
                }

                closeModal(deleteModal);
                window.Auth.logout();
            } catch (err) {
                showErrors(
                    [{ message: err.message || "Could not delete your account." }],
                    { title: "Could Not Delete Account", closeLabel: "Close" }
                );
            } finally {
                confirmDeleteBtn.disabled = false;
                if (deleteSubmitText) deleteSubmitText.textContent = "Delete Account";
            }
        });
    }
});
