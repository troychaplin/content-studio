/**
 * Single replacement functionality for Content Studio
 */

import { escapeHtml, getElement, addEvent, makeAjaxRequest, setButtonLoading, showNotification } from './utils.js';

class SingleReplacementManager {
	constructor() {
		this.searchResultsData = null;
		this.init();
	}

	init() {
		this.bindEvents();
	}

	bindEvents() {
		const findBtn = getElement('find-instances');
		const replaceBtn = getElement('replace-instances');

		if (findBtn) {
			addEvent(findBtn, 'click', this.handleFindInstances.bind(this));
		}

		if (replaceBtn) {
			addEvent(replaceBtn, 'click', this.handleReplaceInstances.bind(this));
		}

		// Event delegation for pagination
		document.addEventListener('click', this.handlePagination.bind(this));
	}

	handlePagination(event) {
		const target = event.target;
		if (!target.classList.contains('pagination-btn')) return;

		const page = parseInt(target.dataset.page);
		if (!this.searchResultsData || page < 1) return;

		this.searchResultsData.currentPage = page;
		this.updateResultsTable();
	}

	async handleFindInstances(event) {
		const searchUrl = getElement('single-from-url')?.value;

		if (!searchUrl) {
			showNotification('Please enter a URL to search for.', false);
			return;
		}

		await this.findUrlInstances(searchUrl, event.target);
	}

	async handleReplaceInstances(event) {
		const fromUrl = getElement('single-from-url')?.value;
		const toUrl = getElement('single-to-url')?.value;

		if (!fromUrl || !toUrl) {
			showNotification('Please enter both URLs.', false);
			return;
		}

		if (!confirm('Are you sure you want to replace all instances? This action cannot be undone.')) {
			return;
		}

		await this.replaceUrlInstances(fromUrl, toUrl, event.target);
	}

	async findUrlInstances(searchUrl, button) {
		setButtonLoading(button, true, 'Searching...');

		try {
			const data = await makeAjaxRequest('content_studio_find_instances', {
				search_url: searchUrl,
			});

			this.showFindResults(data, searchUrl);
		} catch (error) {
			this.showSingleResults('error', error.message);
		} finally {
			setButtonLoading(button, false);
		}
	}

	async replaceUrlInstances(fromUrl, toUrl, button) {
		setButtonLoading(button, true, 'Replacing...');

		try {
			const data = await makeAjaxRequest('content_studio_replace_instances', {
				from_url: fromUrl,
				to_url: toUrl,
			});

			this.showReplaceResults(data, fromUrl, toUrl);

			// If there's an import preview visible, refresh it to remove the completed replacement
			if (window.importManager && window.importManager.importPreviewData && getElement('import-preview')?.style.display !== 'none') {
				window.importManager.refreshImportPreview();
			}
		} catch (error) {
			this.showSingleResults('error', error.message);
		} finally {
			setButtonLoading(button, false);
		}
	}

	showFindResults(data, searchUrl) {
		let message = `Found ${data.total_found} instances of "${escapeHtml(searchUrl)}" in ${data.locations.length} locations.`;

		let additionalHtml = '';
		if (data.total_found > 0) {
			message += ' Click "Replace All Instances" to replace them.';
			const replaceBtn = getElement('replace-instances');
			if (replaceBtn) replaceBtn.style.display = 'block';

			// Store data for pagination
			this.searchResultsData = {
				locations: data.locations,
				searchUrl,
				currentPage: 1,
				itemsPerPage: 25,
			};

			// Add results table with pagination
			additionalHtml = this.buildPaginatedResultsTable();
		} else {
			message += ' No replacement needed.';
			const replaceBtn = getElement('replace-instances');
			if (replaceBtn) replaceBtn.style.display = 'none';
		}

		this.showSingleResults('info', message, data, additionalHtml);
	}

	buildPaginatedResultsTable() {
		if (!this.searchResultsData) return '';

		const { locations, currentPage, itemsPerPage } = this.searchResultsData;
		const totalPages = Math.ceil(locations.length / itemsPerPage);
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, locations.length);
		const currentLocations = locations.slice(startIndex, endIndex);

		let html = '<div class="search-results-table">';
		html += '<h4>Locations where this URL appears:</h4>';

		// Pagination info
		html += '<div class="pagination-info">';
		html += `Showing ${startIndex + 1} to ${endIndex} of ${locations.length} locations`;
		html += '</div>';

		// Results table
		html += '<div class="results-table">';
		html += '<table class="fixed wp-list-table widefat striped">';
		html += '<thead><tr><th>Title</th><th>Type</th><th>Count</th><th>Actions</th></tr></thead>';
		html += '<tbody>';

		currentLocations.forEach(location => {
			html += '<tr>';
			html += `<td><strong>${escapeHtml(location.title)}</strong></td>`;
			html += `<td>${escapeHtml(location.type)}</td>`;
			html += `<td>${location.count}</td>`;
			html += '<td class="actions-cell">';
			html += '<div class="action-buttons">';
			html += `<a href="${escapeHtml(location.url)}" target="_blank" class="button button-small">View</a>`;
			if (location.edit_url) {
				html += `<a href="${escapeHtml(location.edit_url)}" target="_blank" class="button button-small">Edit</a>`;
			}
			html += '</div>';
			html += '</td>';
			html += '</tr>';
		});

		html += '</tbody></table></div>';

		// Pagination controls
		if (totalPages > 1) {
			html += '<div class="pagination-controls">';

			// Previous button
			if (currentPage > 1) {
				html += `<button type="button" class="button button-secondary pagination-btn" data-page="${currentPage - 1}">← Previous</button>`;
			}

			// Page numbers
			const startPage = Math.max(1, currentPage - 2);
			const endPage = Math.min(totalPages, currentPage + 2);

			if (startPage > 1) {
				html += '<button type="button" class="button button-secondary pagination-btn" data-page="1">1</button>';
				if (startPage > 2) {
					html += '<span class="pagination-ellipsis">...</span>';
				}
			}

			for (let i = startPage; i <= endPage; i++) {
				const activeClass = i === currentPage ? ' button-primary' : ' button-secondary';
				html += `<button type="button" class="button${activeClass} pagination-btn" data-page="${i}">${i}</button>`;
			}

			if (endPage < totalPages) {
				if (endPage < totalPages - 1) {
					html += '<span class="pagination-ellipsis">...</span>';
				}
				html += `<button type="button" class="button button-secondary pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
			}

			// Next button
			if (currentPage < totalPages) {
				html += `<button type="button" class="button button-secondary pagination-btn" data-page="${currentPage + 1}">Next →</button>`;
			}

			html += '</div>';
		}

		html += '</div>';
		return html;
	}

	updateResultsTable() {
		const results = getElement('single-results');
		if (!results || !this.searchResultsData) return;

		const currentHtml = results.innerHTML;
		const newTableHtml = this.buildPaginatedResultsTable();

		// Replace the table part while keeping the summary
		const updatedHtml = currentHtml.replace(
			/<div class="search-results-table">[\s\S]*<\/div>/,
			newTableHtml
		);
		results.innerHTML = updatedHtml;
	}

	showReplaceResults(data, fromUrl, toUrl) {
		const message = `Successfully replaced "${escapeHtml(fromUrl)}" with "${escapeHtml(toUrl)}".`;

		let detailsHtml = '<div class="single-results-details">';
		detailsHtml += '<div class="single-results-stat">';
		detailsHtml += `<span class="number">${data.replaced_posts}</span>`;
		detailsHtml += '<span class="label">Posts & Pages</span>';
		detailsHtml += '</div>';
		detailsHtml += '<div class="single-results-stat">';
		detailsHtml += `<span class="number">${data.replaced_meta}</span>`;
		detailsHtml += '<span class="label">Post Meta (ACF)</span>';
		detailsHtml += '</div>';
		detailsHtml += '</div>';

		this.showSingleResults('success', message, null, detailsHtml);
		const replaceBtn = getElement('replace-instances');
		if (replaceBtn) replaceBtn.style.display = 'none';
	}

	showSingleResults(type, message, data, additionalHtml) {
		const results = getElement('single-results');
		if (!results) return;

		let resultsHtml = `<div class="single-results-summary ${type}">`;
		const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
		resultsHtml += `<h4>${icon} ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</h4>`;
		resultsHtml += `<p>${message}</p>`;

		if (additionalHtml) {
			resultsHtml += additionalHtml;
		}

		resultsHtml += '</div>';

		results.innerHTML = resultsHtml;
		results.style.display = 'block';
	}
}

export default SingleReplacementManager;
