/**
 * Utility functions for Content Studio
 */

/**
 * Escape HTML for display
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, function (m) {
		return map[m];
	});
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {boolean} success - Whether it's a success message
 */
export function showNotification(message, success = true) {
	// Create notification element
	const notification = document.createElement('div');
	notification.className = `notice notice-${success ? 'success' : 'error'} is-dismissible`;
	notification.innerHTML = `
		<p>${escapeHtml(message)}</p>
		<button type="button" class="notice-dismiss">
			<span class="screen-reader-text">Dismiss this notice.</span>
		</button>
	`;

	// Insert at top of content
	const content = document.querySelector('.wrap');
	if (content) {
		content.insertBefore(notification, content.firstChild);
	}

	// Auto-dismiss after 5 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 5000);

	// Handle manual dismiss
	const dismissBtn = notification.querySelector('.notice-dismiss');
	if (dismissBtn) {
		dismissBtn.addEventListener('click', () => {
			notification.remove();
		});
	}
}

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function getElement(id) {
	return document.getElementById(id);
}

/**
 * Get elements by selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {NodeList}
 */
export function getElements(selector, parent = document) {
	return parent.querySelectorAll(selector);
}

/**
 * Add event listener with error handling
 * @param {HTMLElement} element - Element to attach listener to
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
export function addEvent(element, event, handler) {
	if (element) {
		element.addEventListener(event, handler);
	}
}

/**
 * Remove event listener
 * @param {HTMLElement} element - Element to remove listener from
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
export function removeEvent(element, event, handler) {
	if (element) {
		element.removeEventListener(event, handler);
	}
}

/**
 * Make AJAX request
 * @param {string} action - WordPress AJAX action
 * @param {Object} data - Data to send
 * @returns {Promise} Promise that resolves with response
 */
export function makeAjaxRequest(action, data = {}) {
	return new Promise((resolve, reject) => {
		const formData = new FormData();
		formData.append('action', action);
		formData.append('nonce', window.linkReplacement.nonce);

		// Add additional data
		Object.keys(data).forEach(key => {
			formData.append(key, data[key]);
		});

		fetch(window.linkReplacement.ajaxUrl, {
			method: 'POST',
			body: formData,
		})
		.then(response => response.json())
		.then(result => {
			if (result.success) {
				resolve(result.data);
			} else {
				reject(new Error(result.data || 'Unknown error'));
			}
		})
		.catch(error => {
			reject(error);
		});
	});
}

/**
 * Set button loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} loadingText - Text to show when loading
 */
export function setButtonLoading(button, loading, loadingText = 'Loading...') {
	if (!button) return;

	if (loading) {
		button.dataset.originalText = button.textContent;
		button.textContent = loadingText;
		button.disabled = true;
		button.classList.add('loading');
	} else {
		button.textContent = button.dataset.originalText || button.textContent;
		button.disabled = false;
		button.classList.remove('loading');
	}
}

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
	let inThrottle;
	return function executedFunction(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
}
