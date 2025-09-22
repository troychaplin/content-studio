/**
 * Location preview functionality for Content Studio
 */

import { escapeHtml, makeAjaxRequest } from './utils.js';

class LocationPreviewManager {
	constructor() {
		this.init();
	}

	init() {
		// This module is primarily used by other modules
		// but can be extended for standalone location preview functionality
	}

	/**
	 * Load location preview for a replacement
	 * @param {string} searchUrl - URL to search for
	 * @param {HTMLElement} container - Container to display results in
	 * @returns {Promise<void>}
	 */
	async loadLocationPreview(searchUrl, container) {
		if (!container) return;

		// Show loading state
		container.innerHTML = '<div class="preview-loading">Searching for instances...</div>';

		try {
			const data = await makeAjaxRequest('content_studio_find_instances', {
				search_url: searchUrl,
			});

			this.displayLocationPreview(data, container);
		} catch (error) {
			container.innerHTML = `<div class="preview-error">Error: ${escapeHtml(error.message)}</div>`;
		}
	}

	/**
	 * Display location preview data
	 * @param {Object} data - Location data from API
	 * @param {HTMLElement} container - Container to display results in
	 */
	displayLocationPreview(data, container) {
		let previewHtml = '<div class="location-preview">';
		previewHtml += `<h5>Found ${data.total_found} instances in ${data.locations.length} locations:</h5>`;

		if (data.locations.length > 0) {
			previewHtml += '<div class="location-list">';
			data.locations.forEach(location => {
				previewHtml += '<div class="location-item">';
				previewHtml += '<div class="location-header">';
				previewHtml += `<strong>${escapeHtml(location.title)}</strong>`;
				previewHtml += `<span class="location-type">(${escapeHtml(location.type)})</span>`;
				previewHtml += `<span class="location-count">${location.count} instance(s)</span>`;
				previewHtml += '</div>';
				previewHtml += '<div class="location-actions">';
				previewHtml += `<a href="${escapeHtml(location.url)}" target="_blank" class="button button-small">View</a>`;
				if (location.edit_url) {
					previewHtml += `<a href="${escapeHtml(location.edit_url)}" target="_blank" class="button button-small">Edit</a>`;
				}
				previewHtml += '</div>';
				previewHtml += '</div>';
			});
			previewHtml += '</div>';
		} else {
			previewHtml += '<p>No instances found.</p>';
		}

		previewHtml += '</div>';
		container.innerHTML = previewHtml;
	}

	/**
	 * Create a location preview widget
	 * @param {string} searchUrl - URL to search for
	 * @param {Object} options - Display options
	 * @returns {HTMLElement} Preview widget element
	 */
	createLocationPreviewWidget(searchUrl, options = {}) {
		const widget = document.createElement('div');
		widget.className = 'location-preview-widget';
		
		const header = document.createElement('div');
		header.className = 'location-preview-header';
		header.innerHTML = `<h4>Location Preview: ${escapeHtml(searchUrl)}</h4>`;
		
		const content = document.createElement('div');
		content.className = 'location-preview-content';
		content.innerHTML = '<div class="preview-loading">Loading...</div>';
		
		widget.appendChild(header);
		widget.appendChild(content);
		
		// Load the preview data
		this.loadLocationPreview(searchUrl, content);
		
		return widget;
	}

	/**
	 * Toggle location preview visibility
	 * @param {HTMLElement} previewElement - Preview element to toggle
	 * @param {HTMLElement} toggleButton - Button that toggles the preview
	 */
	toggleLocationPreview(previewElement, toggleButton) {
		if (!previewElement || !toggleButton) return;

		const isVisible = previewElement.style.display !== 'none';
		
		if (isVisible) {
			previewElement.style.display = 'none';
			toggleButton.textContent = 'Show Preview';
		} else {
			previewElement.style.display = 'block';
			toggleButton.textContent = 'Hide Preview';
		}
	}

	/**
	 * Create a collapsible location preview
	 * @param {string} searchUrl - URL to search for
	 * @param {Object} options - Display options
	 * @returns {HTMLElement} Collapsible preview element
	 */
	createCollapsibleLocationPreview(searchUrl, options = {}) {
		const container = document.createElement('div');
		container.className = 'collapsible-location-preview';
		
		const toggleButton = document.createElement('button');
		toggleButton.type = 'button';
		toggleButton.className = 'button button-secondary location-preview-toggle';
		toggleButton.textContent = 'Show Location Preview';
		
		const previewContent = document.createElement('div');
		previewContent.className = 'location-preview-content';
		previewContent.style.display = 'none';
		
		// Add toggle functionality
		toggleButton.addEventListener('click', () => {
			this.toggleLocationPreview(previewContent, toggleButton);
			
			// Load content if it's being shown for the first time
			if (previewContent.style.display !== 'none' && !previewContent.dataset.loaded) {
				this.loadLocationPreview(searchUrl, previewContent);
				previewContent.dataset.loaded = 'true';
			}
		});
		
		container.appendChild(toggleButton);
		container.appendChild(previewContent);
		
		return container;
	}
}

export default LocationPreviewManager;
