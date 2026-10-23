document.addEventListener("DOMContentLoaded", () => {
    const { openModal, closeModal, extractApiErrors, showErrors } = window.UI || {};

    // ========================================================
    // MODAL CONTAINERS
    // ========================================================
    const createPostModal = document.getElementById("create-post-modal");
    const editPostModal = document.getElementById("edit-post-modal");
    const deletePostModal = document.getElementById("delete-post-modal");
    const successModal = document.getElementById("success-modal");
    const errorModal = document.getElementById("error-modal");

    // ========================================================
    // CREATE POST MODAL ELEMENTS
    // ========================================================
    const openCreatePostBtn = document.getElementById("open-create-post-btn");
    const createPostForm = document.getElementById("create-post-form");
    const cancelCreatePostBtn = document.getElementById("cancel-create-post-btn");
    const closeCreatePostXBtn = document.getElementById("close-create-post-x-btn");
    const titleInput = document.getElementById("post-title");
    const contentInput = document.getElementById("post-content");
    const publishedCheckbox = document.getElementById("post-published");
    const titleCharCount = document.getElementById("title-char-count");
    const contentCharCount = document.getElementById("content-char-count");
    const createPostAuthorBadge = document.getElementById("create-post-author-badge");
    const submitBtn = document.getElementById("submit-create-post-btn");
    const submitBtnText = document.getElementById("submit-btn-text");

    // ========================================================
    // EDIT POST MODAL ELEMENTS
    // ========================================================
    const editPostForm = document.getElementById("edit-post-form");
    const editPostId = document.getElementById("edit-post-id");
    const editPostTitle = document.getElementById("edit-post-title");
    const editPostContent = document.getElementById("edit-post-content");
    const editPostPublished = document.getElementById("edit-post-published");
    const editTitleCharCount = document.getElementById("edit-title-char-count");
    const editContentCharCount = document.getElementById("edit-content-char-count");
    const editPostAuthorBadge = document.getElementById("edit-post-author-badge");
    const cancelEditPostBtn = document.getElementById("cancel-edit-post-btn");
    const closeEditPostXBtn = document.getElementById("close-edit-post-x-btn");
    const submitEditPostBtn = document.getElementById("submit-edit-post-btn");
    const editSubmitBtnText = document.getElementById("edit-submit-btn-text");

    // ========================================================
    // DELETE POST MODAL ELEMENTS
    // ========================================================
    const deletePostId = document.getElementById("delete-post-id");
    const deletePostMeta = document.getElementById("delete-post-meta");
    const deletePostTitle = document.getElementById("delete-post-title");
    const cancelDeletePostBtn = document.getElementById("cancel-delete-post-btn");
    const confirmDeletePostBtn = document.getElementById("confirm-delete-post-btn");
    const deleteBtnText = document.getElementById("delete-btn-text");

    // ========================================================
    // SUCCESS & ERROR MODAL ELEMENTS
    // ========================================================
    const closeSuccessBtn = document.getElementById("close-success-btn");
    const closeErrorBtn = document.getElementById("close-error-btn");

    let currentSuccessCallback = null;

    // ========================================================
    // AUTH HELPERS
    // ========================================================
    async function requireUser() {
        const user = window.Auth ? await window.Auth.ready : null;
        if (!user) {
            if (window.Auth) window.Auth.redirectToLogin();
            return null;
        }
        return user;
    }

    function showApiError(payload, status, closeLabel = "Back to Editor") {
        showErrors(extractApiErrors(payload, status), {
            desc: "The server returned the following error(s):",
            closeLabel
        });
    }

    function showError(message, title = "Unable to Process Request") {
        showErrors([{ message }], { title, closeLabel: "Close" });
    }

    function handle401(response) {
        if (response.status === 401) {
            closeModal(createPostModal);
            closeModal(editPostModal);
            closeModal(deletePostModal);
            if (window.Auth) window.Auth.handleUnauthorized();
            return true;
        }
        return false;
    }

    function updateStatusBadge(post) {
        const badge = document.getElementById(`post-status-${post.id}`);
        if (!badge) return;

        const draftClasses = [
            "bg-amber-500/15",
            "text-amber-700",
            "dark:text-amber-300",
            "border-amber-500/25"
        ];

        if (post.published) {
            badge.textContent = "";
            badge.classList.add("hidden");
            badge.classList.remove(...draftClasses);
        } else {
            badge.textContent = "Draft";
            badge.classList.remove("hidden");
            badge.classList.add(...draftClasses);
        }
    }

    // ========================================================
    // MODAL UTILITIES
    // ========================================================
    function resetCreatePostForm() {
        if (createPostForm) {
            createPostForm.reset();
            if (titleCharCount) titleCharCount.textContent = "0/100";
            if (contentCharCount) {
                contentCharCount.textContent = "0 characters";
                contentCharCount.classList.remove("text-amber-600", "dark:text-amber-400");
            }
        }
    }

    function dismissCreatePost() {
        closeModal(createPostModal);
        resetCreatePostForm();
    }

    function showSuccessModal({
        title,
        desc,
        postId,
        postTitle,
        viewLink,
        hideViewLink,
        onCloseAction
    }) {
        currentSuccessCallback = onCloseAction || null;

        const modalTitle = document.getElementById("success-modal-title");
        const modalDesc = document.getElementById("success-modal-desc");
        const postMeta = document.getElementById("success-post-meta");
        const postTitleEl = document.getElementById("success-post-title");
        const viewPostLink = document.getElementById("success-view-post-link");

        if (modalTitle && title) modalTitle.textContent = title;
        if (modalDesc && desc) modalDesc.textContent = desc;
        if (postMeta && postId) postMeta.textContent = `#post-${postId}`;
        if (postTitleEl && postTitle) postTitleEl.textContent = postTitle;

        if (viewPostLink) {
            if (hideViewLink) {
                viewPostLink.style.display = "none";
            } else {
                viewPostLink.style.display = "inline-flex";
                viewPostLink.href = viewLink || `/posts/${postId}`;
            }
        }

        openModal(successModal);
    }

    // ========================================================
    // CHARACTER COUNTERS
    // ========================================================
    if (titleInput && titleCharCount) {
        titleInput.addEventListener("input", () => {
            titleCharCount.textContent = `${titleInput.value.length}/100`;
        });
    }

    if (contentInput && contentCharCount) {
        contentInput.addEventListener("input", () => {
            const count = contentInput.value.length;
            contentCharCount.textContent = `${count} characters`;
            if (count > 0 && count < 20) {
                contentCharCount.classList.add("text-amber-600", "dark:text-amber-400");
            } else {
                contentCharCount.classList.remove("text-amber-600", "dark:text-amber-400");
            }
        });
    }

    if (editPostTitle && editTitleCharCount) {
        editPostTitle.addEventListener("input", () => {
            editTitleCharCount.textContent = `${editPostTitle.value.length}/100`;
        });
    }

    if (editPostContent && editContentCharCount) {
        editPostContent.addEventListener("input", () => {
            const count = editPostContent.value.length;
            editContentCharCount.textContent = `${count} characters`;
            if (count > 0 && count < 20) {
                editContentCharCount.classList.add("text-amber-600", "dark:text-amber-400");
            } else {
                editContentCharCount.classList.remove("text-amber-600", "dark:text-amber-400");
            }
        });
    }

    // ========================================================
    // GLOBAL MODAL LISTENERS (BACKDROP & ESC KEY)
    // ========================================================
    [createPostModal, editPostModal, deletePostModal, successModal, errorModal].forEach(
        (modal) => {
            if (!modal) return;
            modal.addEventListener("click", (e) => {
                if (e.target !== modal) return;
                if (modal === createPostModal) {
                    dismissCreatePost();
                } else if (modal === successModal) {
                    closeModal(successModal);
                    if (currentSuccessCallback) {
                        currentSuccessCallback();
                        currentSuccessCallback = null;
                    }
                } else {
                    closeModal(modal);
                }
            });
        }
    );

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (errorModal && !errorModal.classList.contains("opacity-0")) {
            closeModal(errorModal);
        } else if (deletePostModal && !deletePostModal.classList.contains("opacity-0")) {
            closeModal(deletePostModal);
        } else if (successModal && !successModal.classList.contains("opacity-0")) {
            closeModal(successModal);
            if (currentSuccessCallback) {
                currentSuccessCallback();
                currentSuccessCallback = null;
            }
        } else if (editPostModal && !editPostModal.classList.contains("opacity-0")) {
            closeModal(editPostModal);
        } else if (createPostModal && !createPostModal.classList.contains("opacity-0")) {
            dismissCreatePost();
        }
    });

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener("click", () => closeModal(errorModal));
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener("click", () => {
            closeModal(successModal);
            if (currentSuccessCallback) {
                currentSuccessCallback();
                currentSuccessCallback = null;
            }
        });
    }

    // ========================================================
    // CREATE POST
    // ========================================================
    if (openCreatePostBtn) {
        openCreatePostBtn.addEventListener("click", async () => {
            const user = await requireUser();
            if (!user) return;

            if (createPostAuthorBadge) {
                createPostAuthorBadge.textContent = `@${user.username} · ID ${user.id}`;
            }

            openModal(createPostModal);
            if (titleInput) setTimeout(() => titleInput.focus(), 60);
        });
    }

    if (cancelCreatePostBtn) {
        cancelCreatePostBtn.addEventListener("click", dismissCreatePost);
    }

    if (closeCreatePostXBtn) {
        closeCreatePostXBtn.addEventListener("click", dismissCreatePost);
    }

    if (createPostForm) {
        createPostForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const user = await requireUser();
            if (!user) return;

            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            const published = publishedCheckbox ? publishedCheckbox.checked : true;

            if (submitBtn) {
                submitBtn.disabled = true;
                if (submitBtnText) submitBtnText.textContent = "Saving...";
            }

            try {
                const response = await window.Auth.apiFetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content, published })
                });

                if (handle401(response)) return;

                if (!response.ok) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = {
                            detail: `Server error (${response.status} ${response.statusText})`
                        };
                    }
                    showApiError(errJson, response.status);
                    return;
                }

                const postData = await response.json();
                closeModal(createPostModal);
                resetCreatePostForm();

                showSuccessModal({
                    title: "Post Created Successfully!",
                    desc: published
                        ? "Your post has been published."
                        : "Your draft has been saved.",
                    postId: postData.id,
                    postTitle: postData.title || title,
                    viewLink: `/posts/${postData.id}`,
                    onCloseAction: () => {
                        const path = window.location.pathname;
                        if (path === "/" || path === `/users/${user.id}/posts`) {
                            window.location.reload();
                        }
                    }
                });
            } catch (networkError) {
                showErrors(
                    [
                        {
                            field: "Network Error",
                            message:
                                networkError.message ||
                                "Failed to reach the server. Check your connection."
                        }
                    ],
                    { closeLabel: "Back to Editor" }
                );
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtnText) submitBtnText.textContent = "Publish Post";
                }
            }
        });
    }

    // ========================================================
    // EDIT POST
    // ========================================================
    document.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".edit-post-btn");
        if (!editBtn) return;

        const user = await requireUser();
        if (!user) return;

        const postId = editBtn.dataset.postId;
        if (!postId) return;

        if (
            editBtn.dataset.postAuthorId &&
            Number(editBtn.dataset.postAuthorId) !== user.id
        ) {
            showError("You can only edit your own posts.", "Not Allowed");
            return;
        }

        const originalContent = editBtn.innerHTML;
        editBtn.disabled = true;
        editBtn.innerHTML =
            `<span class="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>`;

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                headers: { Accept: "application/json" }
            });

            if (!res.ok) {
                let errJson = null;
                try {
                    errJson = await res.json();
                } catch {
                    errJson = null;
                }
                showApiError(errJson, res.status);
                return;
            }

            const post = await res.json();

            if (post.user_id !== user.id) {
                showError("You can only edit your own posts.", "Not Allowed");
                return;
            }

            if (editPostId) editPostId.value = post.id;
            if (editPostTitle) editPostTitle.value = post.title || "";
            if (editPostContent) editPostContent.value = post.content || "";
            if (editPostPublished) editPostPublished.checked = !!post.published;

            if (editTitleCharCount) {
                editTitleCharCount.textContent = `${(post.title || "").length}/100`;
            }
            if (editContentCharCount) {
                const len = (post.content || "").length;
                editContentCharCount.textContent = `${len} characters`;
                editContentCharCount.classList.toggle(
                    "text-amber-600",
                    len > 0 && len < 20
                );
                editContentCharCount.classList.toggle(
                    "dark:text-amber-400",
                    len > 0 && len < 20
                );
            }
            if (editPostAuthorBadge) {
                editPostAuthorBadge.textContent = `@${post.author?.username || user.username} · ID ${post.user_id}`;
            }

            openModal(editPostModal);
            if (editPostTitle) setTimeout(() => editPostTitle.focus(), 60);
        } catch (err) {
            showError(err.message || "Failed to load the post for editing.");
        } finally {
            editBtn.disabled = false;
            editBtn.innerHTML = originalContent;
            if (window.lucide) window.lucide.createIcons();
        }
    });

    if (cancelEditPostBtn) {
        cancelEditPostBtn.addEventListener("click", () => closeModal(editPostModal));
    }
    if (closeEditPostXBtn) {
        closeEditPostXBtn.addEventListener("click", () => closeModal(editPostModal));
    }

    if (editPostForm) {
        editPostForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const user = await requireUser();
            if (!user) return;

            const postId = editPostId.value;
            const title = editPostTitle.value.trim();
            const content = editPostContent.value.trim();
            const published = editPostPublished ? editPostPublished.checked : true;

            if (submitEditPostBtn) {
                submitEditPostBtn.disabled = true;
                if (editSubmitBtnText) editSubmitBtnText.textContent = "Saving...";
            }

            try {
                const response = await window.Auth.apiFetch(`/api/posts/${postId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content, published })
                });

                if (handle401(response)) return;

                if (!response.ok) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = {
                            detail: `Server error (${response.status} ${response.statusText})`
                        };
                    }
                    showApiError(errJson, response.status);
                    return;
                }

                const updatedPost = await response.json();
                closeModal(editPostModal);

                showSuccessModal({
                    title: "Post Updated Successfully!",
                    desc: "Your changes have been saved.",
                    postId: updatedPost.id,
                    postTitle: updatedPost.title,
                    viewLink: `/posts/${updatedPost.id}`,
                    onCloseAction: () => {
                        const titleLink = document.getElementById(
                            `post-title-link-${updatedPost.id}`
                        );
                        const contentP = document.getElementById(
                            `post-content-p-${updatedPost.id}`
                        );
                        if (titleLink) titleLink.textContent = updatedPost.title;
                        if (contentP) contentP.textContent = updatedPost.content;

                        updateStatusBadge(updatedPost);

                        // Drafts are only rendered for their owner, so a post
                        // that just got published may need to appear/disappear.
                        if (updatedPost.published) {
                            const card = document.getElementById(
                                `post-card-${updatedPost.id}`
                            );
                            if (card) card.style.display = "";
                        }

                        if (window.location.pathname === `/posts/${updatedPost.id}`) {
                            window.location.reload();
                        } else if (window.Auth) {
                            window.Auth.refreshPostLists();
                        }
                    }
                });
            } catch (err) {
                showError(err.message || "Failed to update the post.");
            } finally {
                if (submitEditPostBtn) {
                    submitEditPostBtn.disabled = false;
                    if (editSubmitBtnText) editSubmitBtnText.textContent = "Save Changes";
                }
            }
        });
    }

    // ========================================================
    // DELETE POST
    // ========================================================
    document.addEventListener("click", async (e) => {
        const delBtn = e.target.closest(".delete-post-btn");
        if (!delBtn) return;

        const user = await requireUser();
        if (!user) return;

        const postId = delBtn.dataset.postId;
        const postTitle = delBtn.dataset.postTitle || `Post #${postId}`;
        if (!postId) return;

        if (
            delBtn.dataset.postAuthorId &&
            Number(delBtn.dataset.postAuthorId) !== user.id
        ) {
            showError("You can only delete your own posts.", "Not Allowed");
            return;
        }

        if (deletePostId) deletePostId.value = postId;
        if (deletePostMeta) deletePostMeta.textContent = `#post-${postId}`;
        if (deletePostTitle) deletePostTitle.textContent = postTitle;

        openModal(deletePostModal);
    });

    if (cancelDeletePostBtn) {
        cancelDeletePostBtn.addEventListener("click", () => closeModal(deletePostModal));
    }

    if (confirmDeletePostBtn) {
        confirmDeletePostBtn.addEventListener("click", async () => {
            const postId = deletePostId.value;
            if (!postId) return;

            confirmDeletePostBtn.disabled = true;
            if (deleteBtnText) deleteBtnText.textContent = "Deleting...";

            try {
                const response = await window.Auth.apiFetch(`/api/posts/${postId}`, {
                    method: "DELETE"
                });

                if (handle401(response)) return;

                if (!response.ok && response.status !== 204) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = {
                            detail: `Server error (${response.status} ${response.statusText})`
                        };
                    }
                    showApiError(errJson, response.status);
                    return;
                }

                closeModal(deletePostModal);

                showSuccessModal({
                    title: "Post Deleted Successfully!",
                    desc: `Article #${postId} has been permanently deleted.`,
                    postId: postId,
                    postTitle: deletePostTitle.textContent,
                    hideViewLink: true,
                    onCloseAction: () => {
                        if (window.location.pathname === `/posts/${postId}`) {
                            window.location.href = "/";
                        } else {
                            const card = document.getElementById(`post-card-${postId}`);
                            if (card) {
                                card.style.transition =
                                    "opacity 0.25s ease, transform 0.25s ease";
                                card.style.opacity = "0";
                                card.style.transform = "scale(0.95)";
                                setTimeout(() => {
                                    card.remove();
                                    if (window.Auth) window.Auth.refreshPostLists();
                                }, 250);
                            }
                        }
                    }
                });
            } catch (err) {
                showError(err.message || "Failed to delete the post.");
            } finally {
                confirmDeletePostBtn.disabled = false;
                if (deleteBtnText) deleteBtnText.textContent = "Delete Post";
            }
        });
    }
});
