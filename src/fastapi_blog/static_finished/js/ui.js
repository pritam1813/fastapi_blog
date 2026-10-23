/**
 * UI helpers shared by the page scripts: modal open/close, FastAPI error
 * rendering and lightweight toasts.
 */
(function () {
    "use strict";

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
            window.lucide.createIcons();
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

    /**
     * Turn a FastAPI error payload into a list of { field, message } objects.
     */
    function extractApiErrors(data, statusCode) {
        const errors = [];

        if (!data) {
            errors.push({
                field: "",
                message: `Request failed with HTTP status ${statusCode || "unknown"}.`
            });
            return errors;
        }

        // Pydantic validation errors: detail is an array
        if (Array.isArray(data.detail)) {
            data.detail.forEach((item) => {
                let fieldName = "";
                if (Array.isArray(item.loc) && item.loc.length > 0) {
                    const lastPart = item.loc[item.loc.length - 1];
                    if (typeof lastPart === "string" && lastPart !== "body") {
                        fieldName =
                            lastPart.charAt(0).toUpperCase() +
                            lastPart.slice(1).replace(/_/g, " ");
                    }
                }
                errors.push({
                    field: fieldName,
                    message: item.msg || "Invalid value"
                });
            });
            return errors;
        }

        // HTTPException(detail="...")
        if (typeof data.detail === "string") {
            errors.push({ field: "", message: data.detail });
            return errors;
        }

        if (data.detail && typeof data.detail === "object") {
            errors.push({ field: "", message: JSON.stringify(data.detail) });
            return errors;
        }

        if (typeof data.message === "string") {
            errors.push({ field: "", message: data.message });
            return errors;
        }

        errors.push({
            field: "",
            message: `Unexpected error (HTTP ${statusCode || 500}).`
        });
        return errors;
    }

    /**
     * Render the shared error modal.
     *
     * @param {Array<{field?: string, message: string}>} errors
     * @param {{title?: string, desc?: string, closeLabel?: string}} options
     */
    function showErrors(errors, options = {}) {
        const modal = document.getElementById("error-modal");
        const titleEl = document.getElementById("error-modal-title");
        const descEl = document.getElementById("error-modal-desc");
        const listEl = document.getElementById("error-modal-list");
        const closeBtn = document.getElementById("close-error-btn");

        if (!modal || !listEl) return;

        if (titleEl) titleEl.textContent = options.title || "Unable to Process Request";
        if (descEl) {
            descEl.textContent = options.desc || "The server returned the following error(s):";
        }
        if (closeBtn) closeBtn.textContent = options.closeLabel || "Close";

        listEl.innerHTML = "";
        const ul = document.createElement("ul");
        ul.className = "space-y-1.5 list-none p-0 m-0";

        errors.forEach((err) => {
            const li = document.createElement("li");
            li.className = "flex items-start gap-2";

            const bullet = document.createElement("span");
            bullet.className = "inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5";

            const text = document.createElement("span");
            if (err.field) {
                const strong = document.createElement("strong");
                strong.className = "font-semibold text-red-900 dark:text-red-200 mr-1";
                strong.textContent = `${err.field}:`;
                text.appendChild(strong);
                text.appendChild(document.createTextNode(err.message));
            } else {
                text.textContent = err.message;
            }

            li.appendChild(bullet);
            li.appendChild(text);
            ul.appendChild(li);
        });

        listEl.appendChild(ul);
        openModal(modal);
    }

    /**
     * Small auto-dismissing toast, independent of Tailwind so it always works.
     */
    function toast(message, type = "success") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.setAttribute("aria-live", "polite");
            container.style.cssText =
                "position:fixed;right:1.25rem;bottom:1.25rem;z-index:100;display:flex;" +
                "flex-direction:column;align-items:flex-end;gap:0.5rem;pointer-events:none;";
            document.body.appendChild(container);
        }

        const el = document.createElement("div");
        const background = type === "error" ? "#dc2626" : "#059669";
        el.textContent = message;
        el.style.cssText =
            `background:${background};color:#fff;font-size:0.875rem;font-weight:600;` +
            "padding:0.65rem 1rem;border-radius:0.375rem;box-shadow:0 10px 25px rgba(0,0,0,0.2);" +
            "opacity:0;transform:translateY(0.5rem);transition:opacity .2s ease,transform .2s ease;";
        container.appendChild(el);

        requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        });

        setTimeout(() => {
            el.style.opacity = "0";
            el.style.transform = "translateY(0.5rem)";
            setTimeout(() => el.remove(), 250);
        }, 3200);
    }

    window.UI = {
        openModal,
        closeModal,
        extractApiErrors,
        showErrors,
        toast
    };
})();
