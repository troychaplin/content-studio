/**
 * Import functionality for Content Studio
 */

import { escapeHtml, getElement, addEvent, makeAjaxRequest, setButtonLoading, showNotification } from './utils.js';

class ImportManager {
	constructor() {
		this.importPreviewData = null;
		this.init();
	}

	init() {
		this.bindEvents();
	}

	bindEvents() {
		const previewBtn = getElement('preview-import');
		const importBtn = getElement('import-urls');

		if (previewBtn) {
			addEvent(previewBtn, 'click', this.handlePreviewImport.bind(this));
		}

		if (importBtn) {
			addEvent(importBtn, 'click', this.handleImport.bind(this));
		}

		// Event delegation for dynamically created buttons
		document.addEventListener('click', this.handleDynamicEvents.bind(this));
	}

	handleDynamicEvents(event) {
		const target = event.target;

		if (target.classList.contains('edit-replacement-btn')) {
			const index = parseInt(target.dataset.index);
			this.editReplacement(index);
		}

		if (target.classList.contains('preview-locations-btn')) {
			const index = parseInt(target.dataset.index);
			this.toggleLocationPreview(index, target);
		}
	}

	async handlePreviewImport(event) {
		const fileInput = getElement('import-file');
		const file = fileInput?.files[0];

		if (!file) {
			showNotification('Please select a file to preview.', false);
			return;
		}

		try {
			const content = await this.readFile(file);
			const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
			await this.previewImport(content, fileType, event.target);
		} catch (error) {
			showNotification('Error reading file: ' + error.message, false);
		}
	}

	async handleImport(event) {
		const fileInput = getElement('import-file');
		const file = fileInput?.files[0];

		if (!file) {
			showNotification('Please select a file to import.', false);
			return;
		}

		try {
			const content = await this.readFile(file);
			const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
			await this.importReplacements(content, fileType, event.target);
		} catch (error) {
			showNotification('Error reading file: ' + error.message, false);
		}
	}

	readFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.onerror = (e) => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	async previewImport(content, fileType, button) {
		setButtonLoading(button, true, 'Previewing...');

		try {
			const data = await makeAjaxRequest('content_studio_preview_import', {
				file_content: content,
				file_type: fileType,
			});

			this.showImportPreview(data);
		} catch (error) {
			this.showImportResult(error.message, false);
		} finally {
			setButtonLoading(button, false);
		}
	}

	async importReplacements(content, fileType, button) {
		setButtonLoading(button, true, 'Importing...');

		try {
			const data = await makeAjaxRequest('content_studio_import_urls', {
				file_content: content,
				file_type: fileType,
			});

			this.showImportResult(data.message, true);
			
			// Refresh the page to show new replacements
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (error) {
			this.showImportResult(error.message, false);
		} finally {
			setButtonLoading(button, false);
		}
	}

	showImportPreview(data) {
		const preview = getElement('import-preview');
		const importButton = getElement('import-urls');

		if (!preview) return;

		// Handle case where no URLs with instances were found
		if (data.count === 0) {
			let noResultsHtml = '<h4>No URLs with instances found</h4>';
			noResultsHtml += '<p>None of the URLs in your import file were found on this site.</p>';
			if (data.total_imported && data.total_imported > 0) {
				noResultsHtml += `<p><strong>Total URLs in file:</strong> ${data.total_imported}</p>`;
				noResultsHtml += `<p><strong>URLs with zero instances:</strong> ${data.filtered_out}</p>`;
			}
			noResultsHtml += '<p>You may want to check your URLs or try importing a different file.</p>';

			preview.innerHTML = noResultsHtml;
			preview.style.display = 'block';
			if (importButton) importButton.style.display = 'none';
			return;
		}

		let previewHtml = `<h4>Preview: ${data.count} replacements found`;
		if (data.total_imported && data.total_imported > data.count) {
			previewHtml += ` (filtered from ${data.total_imported} total URLs)`;
		}
		previewHtml += '</h4>';

		// Show filtering information if URLs were filtered out
		if (data.filtered_out && data.filtered_out > 0) {
			previewHtml += '<div class="inline notice notice-info"><p>';
			previewHtml += `<strong>Note:</strong> ${data.filtered_out} URLs were filtered out because they have zero instances on this site. `;
			previewHtml += 'Only URLs that actually exist on your site are shown below.';
			previewHtml += '</p></div>';
		}

		previewHtml += '<div class="preview-table">';
		previewHtml += '<table class="fixed wp-list-table widefat striped">';
		previewHtml += '<thead><tr><th>Old URL</th><th>New URL</th><th>Actions</th></tr></thead>';
		previewHtml += '<tbody>';

		data.replacements.forEach((replacement, index) => {
			previewHtml += `<tr class="replacement-row" data-index="${index}">`;
			previewHtml += `<td><a href="${escapeHtml(replacement.from_url)}" target="_blank">${escapeHtml(replacement.from_url)}</a></td>`;
			previewHtml += `<td><a href="${escapeHtml(replacement.to_url)}" target="_blank">${escapeHtml(replacement.to_url)}</a></td>`;
			previewHtml += '<td class="actions-cell">';
			previewHtml += '<div class="action-buttons">';
			previewHtml += `<button type="button" class="button button-small button-secondary preview-locations-btn" data-index="${index}">Preview Locations</button>`;
			previewHtml += `<button type="button" class="button button-small button-secondary edit-replacement-btn" data-index="${index}">Replace Single</button>`;
			previewHtml += '</div>';
			previewHtml += '</td>';
			previewHtml += '</tr>';
			previewHtml += `<tr class="preview-row" data-index="${index}" style="display: none;">`;
			previewHtml += '<td colspan="3" class="preview-content">';
			previewHtml += '<div class="preview-loading">Loading preview...</div>';
			previewHtml += '</td>';
			previewHtml += '</tr>';
		});

		previewHtml += '</tbody></table></div>';
		previewHtml += '<p><strong>Review the replacements above. Click "Replace Single" to load each replacement into the form above for individual processing.</strong></p>';

		preview.innerHTML = previewHtml;
		preview.style.display = 'block';
		if (importButton) importButton.style.display = 'none';

		// Store data for edit/view functions
		this.importPreviewData = data;
	}

	showImportResult(message, success) {
		const result = getElement('import-result');
		if (!result) return;

		result.className = success ? 'success' : 'error';
		result.innerHTML = `<p>${escapeHtml(message)}</p>`;
		result.style.display = 'block';

		if (success) {
			setTimeout(() => {
				result.style.display = 'none';
			}, 5000);
		}
	}

	refreshImportPreview() {
		if (!this.importPreviewData) return;

		// Filter out the replacement that was just completed
		const fromUrl = getElement('single-from-url')?.value;
		const toUrl = getElement('single-to-url')?.value;

		if (fromUrl && toUrl) {
			this.importPreviewData.replacements = this.importPreviewData.replacements.filter(
				replacement => !(replacement.from_url === fromUrl && replacement.to_url === toUrl)
			);

			// Update the count
			this.importPreviewData.count = this.importPreviewData.replacements.length;

			// Re-render the preview
			this.showImportPreview(this.importPreviewData);
		}
	}

	async toggleLocationPreview(index, button) {
		const previewRow = document.querySelector(`.preview-row[data-index="${index}"]`);

		if (!previewRow) return;

		if (previewRow.style.display === 'none') {
			// Expand and load preview
			previewRow.style.display = 'table-row';
			button.textContent = 'Hide Preview';
			await this.loadLocationPreview(index);
		} else {
			// Collapse
			previewRow.style.display = 'none';
			button.textContent = 'Preview Locations';
		}
	}

	async loadLocationPreview(index) {
		if (!this.importPreviewData || !this.importPreviewData.replacements[index]) {
			return;
		}

		const replacement = this.importPreviewData.replacements[index];
		const previewContent = document.querySelector(`.preview-row[data-index="${index}"] .preview-content`);

		if (!previewContent) return;

		// Show loading state
		previewContent.innerHTML = '<div class="preview-loading">Searching for instances...</div>';

		try {
			const data = await makeAjaxRequest('content_studio_find_instances', {
				search_url: replacement.from_url,
			});

			this.displayLocationPreview(data, previewContent);
		} catch (error) {
			previewContent.innerHTML = `<div class="preview-error">Error: ${escapeHtml(error.message)}</div>`;
		}
	}

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

	editReplacement(index) {
		if (!this.importPreviewData || !this.importPreviewData.replacements[index]) {
			return;
		}

		const replacement = this.importPreviewData.replacements[index];

		// Fill the single replacement form with this data
		const fromUrlInput = getElement('single-from-url');
		const toUrlInput = getElement('single-to-url');

		if (fromUrlInput) fromUrlInput.value = replacement.from_url;
		if (toUrlInput) toUrlInput.value = replacement.to_url;

		// Scroll to the single replacement section
		const singleSection = document.querySelector('.content-studio-single-replacement');
		if (singleSection) {
			singleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}

		// Show a brief message
		const results = getElement('single-results');
		if (results) {
			results.innerHTML = '<div class="single-results-summary info"><h4>ℹ Info</h4><p>Replacement loaded into Single URL Replacement form above.</p></div>';
			results.style.display = 'block';
		}
	}
}

export default ImportManager;
