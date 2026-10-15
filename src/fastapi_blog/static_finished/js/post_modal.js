document.addEventListener("DOMContentLoaded", () => {
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
    const errorModalList = document.getElementById("error-modal-list");

    let currentSuccessCallback = null;

    // ========================================================
    // MODAL OPEN / CLOSE UTILITIES
    // ========================================================
    function openModal(modal) {
        if (!modal) return;
        modal.classList.remove("opacity-0", "pointer-events-none");
        modal.classList.add("opacity-100", "pointer-events-auto");
        const card = modal.querySelector(".modal-card");
        if (card) {
            card.classList.remove("scale-95");
            card.classList.add("scale-100");
        }
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.add("opacity-0", "pointer-events-none");
        modal.classList.remove("opacity-100", "pointer-events-auto");
        const card = modal.querySelector(".modal-card");
        if (card) {
            card.classList.add("scale-95");
            card.classList.remove("scale-100");
        }
    }

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

    function showSuccessModal({ title, desc, postId, postTitle, viewLink, hideViewLink, onCloseAction }) {
        currentSuccessCallback = onCloseAction || null;

        const modalTitle = document.getElementById("success-modal-title");
        const modalDesc = document.getElementById("success-modal-desc");
        const postMeta = document.getElementById("success-post-meta");
        const postTitleEl = document.getElementById("success-post-title");
        const previewBox = document.getElementById("success-post-preview");
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
    [createPostModal, editPostModal, deletePostModal, successModal, errorModal].forEach((modal) => {
        if (!modal) return;
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
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
            }
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
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
        }
    });

    // Close error modal returns to editor
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener("click", () => {
            closeModal(errorModal);
        });
    }

    // Close success modal triggers action
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
    // FASTAPI ERROR EXTRACTOR & DISPLAY
    // ========================================================
    function extractFastApiErrors(data, statusCode) {
        const errors = [];

        if (!data) {
            errors.push({ field: "", message: `Request failed with HTTP status ${statusCode || "unknown"}.` });
            return errors;
        }

        // Case 1: Pydantic validation errors (array in detail)
        if (Array.isArray(data.detail)) {
            data.detail.forEach((item) => {
                let fieldName = "";
                if (Array.isArray(item.loc) && item.loc.length > 0) {
                    const lastPart = item.loc[item.loc.length - 1];
                    if (typeof lastPart === "string" && lastPart !== "body") {
                        fieldName = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/_/g, " ");
                    }
                }
                const msg = item.msg || "Invalid value";
                errors.push({
                    field: fieldName,
                    message: msg
                });
            });
            return errors;
        }

        // Case 2: String detail (e.g. HTTPException(detail="User not found"))
        if (typeof data.detail === "string") {
            errors.push({ field: "", message: data.detail });
            return errors;
        }

        // Case 3: Object detail
        if (data.detail && typeof data.detail === "object") {
            errors.push({ field: "", message: JSON.stringify(data.detail) });
            return errors;
        }

        // Case 4: Top-level message
        if (typeof data.message === "string") {
            errors.push({ field: "", message: data.message });
            return errors;
        }

        errors.push({ field: "", message: `Unexpected error (HTTP ${statusCode || 500}).` });
        return errors;
    }

    function displayErrors(errors) {
        if (!errorModalList) return;
        errorModalList.innerHTML = "";

        const ul = document.createElement("ul");
        ul.className = "space-y-1.5 list-none p-0 m-0";

        errors.forEach((err) => {
            const li = document.createElement("li");
            li.className = "flex items-start gap-2";

            const bullet = document.createElement("span");
            bullet.className = "inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5";

            const textSpan = document.createElement("span");
            if (err.field) {
                const bold = document.createElement("strong");
                bold.className = "font-semibold text-red-900 dark:text-red-200 mr-1";
                bold.textContent = `${err.field}:`;
                textSpan.appendChild(bold);
                textSpan.appendChild(document.createTextNode(err.message));
            } else {
                textSpan.textContent = err.message;
            }

            li.appendChild(bullet);
            li.appendChild(textSpan);
            ul.appendChild(li);
        });

        errorModalList.appendChild(ul);
        openModal(errorModal);
    }

    // ========================================================
    // CREATE POST ACTION
    // ========================================================
    if (openCreatePostBtn) {
        openCreatePostBtn.addEventListener("click", () => {
            openModal(createPostModal);
            if (titleInput) {
                setTimeout(() => titleInput.focus(), 60);
            }
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

            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            const published = publishedCheckbox ? publishedCheckbox.checked : true;
            const userId = 5; // Hardcoded user id 5 for now

            if (submitBtn) {
                submitBtn.disabled = true;
                if (submitBtnText) submitBtnText.textContent = "Publishing...";
            }

            try {
                const response = await fetch("/api/posts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content,
                        published: published,
                        user_id: userId
                    })
                });

                if (!response.ok) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = { detail: `Server error (${response.status} ${response.statusText})` };
                    }
                    displayErrors(extractFastApiErrors(errJson, response.status));
                    return;
                }

                const postData = await response.json();
                closeModal(createPostModal);
                resetCreatePostForm();

                showSuccessModal({
                    title: "Post Created Successfully!",
                    desc: "Your post has been successfully recorded and published.",
                    postId: postData.id,
                    postTitle: postData.title || title,
                    viewLink: `/posts/${postData.id}`,
                    onCloseAction: () => {
                        if (window.location.pathname === "/" || window.location.pathname.startsWith("/users/5/posts")) {
                            window.location.reload();
                        }
                    }
                });

            } catch (networkError) {
                displayErrors([
                    {
                        field: "Network Error",
                        message: networkError.message || "Failed to connect to the server. Please check your network connection."
                    }
                ]);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtnText) submitBtnText.textContent = "Publish Post";
                }
            }
        });
    }

    // ========================================================
    // EDIT POST ACTION
    // ========================================================
    document.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".edit-post-btn");
        if (!editBtn) return;
        const postId = editBtn.dataset.postId;
        if (!postId) return;

        // Button loading feedback
        const origContent = editBtn.innerHTML;
        editBtn.disabled = true;
        editBtn.innerHTML = `<span class="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>`;

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                headers: { "Accept": "application/json" }
            });

            if (!res.ok) {
                let errJson = null;
                try { errJson = await res.json(); } catch { errJson = null; }
                displayErrors(extractFastApiErrors(errJson, res.status));
                return;
            }

            const post = await res.json();
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
                if (len < 20) {
                    editContentCharCount.classList.add("text-amber-600", "dark:text-amber-400");
                } else {
                    editContentCharCount.classList.remove("text-amber-600", "dark:text-amber-400");
                }
            }
            if (editPostAuthorBadge) {
                editPostAuthorBadge.textContent = `Author ID: ${post.user_id || 5}`;
            }

            openModal(editPostModal);
            if (editPostTitle) {
                setTimeout(() => editPostTitle.focus(), 60);
            }
        } catch (err) {
            displayErrors([{ field: "Network Error", message: err.message || "Failed to load post for editing." }]);
        } finally {
            editBtn.disabled = false;
            editBtn.innerHTML = origContent;
            if (window.lucide) {
                lucide.createIcons();
            }
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
            const postId = editPostId.value;
            const title = editPostTitle.value.trim();
            const content = editPostContent.value.trim();
            const published = editPostPublished ? editPostPublished.checked : true;

            if (submitEditPostBtn) {
                submitEditPostBtn.disabled = true;
                if (editSubmitBtnText) editSubmitBtnText.textContent = "Saving...";
            }

            try {
                // Use PATCH for updating title, content, published
                const response = await fetch(`/api/posts/${postId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content,
                        published: published
                    })
                });

                if (!response.ok) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = { detail: `Server error (${response.status} ${response.statusText})` };
                    }
                    displayErrors(extractFastApiErrors(errJson, response.status));
                    return;
                }

                const updatedPost = await response.json();
                closeModal(editPostModal);

                showSuccessModal({
                    title: "Post Updated Successfully!",
                    desc: "Your modifications have been saved.",
                    postId: updatedPost.id,
                    postTitle: updatedPost.title,
                    viewLink: `/posts/${updatedPost.id}`,
                    onCloseAction: () => {
                        // Dynamically update title and content if in home or user posts list
                        const titleLink = document.getElementById(`post-title-link-${updatedPost.id}`);
                        const contentP = document.getElementById(`post-content-p-${updatedPost.id}`);
                        if (titleLink) titleLink.textContent = updatedPost.title;
                        if (contentP) contentP.textContent = updatedPost.content;

                        // If currently on the individual post page, reload to refresh title and body
                        if (window.location.pathname === `/posts/${updatedPost.id}`) {
                            window.location.reload();
                        }
                    }
                });

            } catch (err) {
                displayErrors([{ field: "Network Error", message: err.message || "Failed to update post." }]);
            } finally {
                if (submitEditPostBtn) {
                    submitEditPostBtn.disabled = false;
                    if (editSubmitBtnText) editSubmitBtnText.textContent = "Save Changes";
                }
            }
        });
    }

    // ========================================================
    // DELETE POST ACTION
    // ========================================================
    document.addEventListener("click", (e) => {
        const delBtn = e.target.closest(".delete-post-btn");
        if (!delBtn) return;
        const postId = delBtn.dataset.postId;
        const postTitle = delBtn.dataset.postTitle || `Post #${postId}`;
        if (!postId) return;

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
                const response = await fetch(`/api/posts/${postId}`, {
                    method: "DELETE"
                });

                if (!response.ok && response.status !== 204) {
                    let errJson = null;
                    try {
                        errJson = await response.json();
                    } catch {
                        errJson = { detail: `Server error (${response.status} ${response.statusText})` };
                    }
                    displayErrors(extractFastApiErrors(errJson, response.status));
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
                        // If on single post view, redirect to home
                        if (window.location.pathname === `/posts/${postId}`) {
                            window.location.href = "/";
                        } else {
                            // If in list view, smooth remove from DOM
                            const card = document.getElementById(`post-card-${postId}`);
                            if (card) {
                                card.style.transition = "opacity 0.25s ease, transform 0.25s ease";
                                card.style.opacity = "0";
                                card.style.transform = "scale(0.95)";
                                setTimeout(() => card.remove(), 250);
                            }
                        }
                    }
                });

            } catch (err) {
                displayErrors([{ field: "Network Error", message: err.message || "Failed to delete post." }]);
            } finally {
                confirmDeletePostBtn.disabled = false;
                if (deleteBtnText) deleteBtnText.textContent = "Delete Post";
            }
        });
    }
});
