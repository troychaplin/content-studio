/**
 * Main admin functionality for Content Studio
 */

import ImportManager from './import.js';
import SingleReplacementManager from './single-replacement.js';
import LocationPreviewManager from './location-preview.js';
import { showNotification } from './utils.js';

class ContentStudioAdmin {
	constructor() {
		this.importManager = null;
		this.singleReplacementManager = null;
		this.locationPreviewManager = null;
		this.init();
	}

	init() {
		// Wait for DOM to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.initializeModules());
		} else {
			this.initializeModules();
		}
	}

	initializeModules() {
		try {
			// Initialize modules
			this.importManager = new ImportManager();
			this.singleReplacementManager = new SingleReplacementManager();
			this.locationPreviewManager = new LocationPreviewManager();

			// Make modules globally available for cross-module communication
			window.importManager = this.importManager;
			window.singleReplacementManager = this.singleReplacementManager;
			window.locationPreviewManager = this.locationPreviewManager;

			// Initialize any additional functionality
			this.initializeAdditionalFeatures();

			console.log('Content Studio Admin initialized successfully');
		} catch (error) {
			console.error('Error initializing Content Studio Admin:', error);
			showNotification('Error initializing admin interface: ' + error.message, false);
		}
	}

	initializeAdditionalFeatures() {
		// Add any additional initialization logic here
		this.setupKeyboardShortcuts();
		this.setupFormValidation();
		this.setupAccessibilityFeatures();
	}

	setupKeyboardShortcuts() {
		// Add keyboard shortcuts for common actions
		document.addEventListener('keydown', (event) => {
			// Ctrl/Cmd + Enter to trigger find instances
			if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
				const findBtn = document.getElementById('find-instances');
				if (findBtn && findBtn.offsetParent !== null) { // Check if visible
					event.preventDefault();
					findBtn.click();
				}
			}

			// Escape to clear results
			if (event.key === 'Escape') {
				const results = document.getElementById('single-results');
				if (results && results.style.display !== 'none') {
					results.style.display = 'none';
				}
			}
		});
	}

	setupFormValidation() {
		// Add real-time form validation
		const fromUrlInput = document.getElementById('single-from-url');
		const toUrlInput = document.getElementById('single-to-url');

		if (fromUrlInput) {
			fromUrlInput.addEventListener('input', this.validateUrlInput.bind(this));
		}

		if (toUrlInput) {
			toUrlInput.addEventListener('input', this.validateUrlInput.bind(this));
		}
	}

	validateUrlInput(event) {
		const input = event.target;
		const url = input.value.trim();

		// Remove previous validation classes
		input.classList.remove('valid', 'invalid');

		if (url === '') {
			return; // Don't validate empty inputs
		}

		// Basic URL validation
		try {
			new URL(url);
			input.classList.add('valid');
		} catch {
			input.classList.add('invalid');
		}
	}

	setupAccessibilityFeatures() {
		// Add ARIA labels and improve accessibility
		const findBtn = document.getElementById('find-instances');
		const replaceBtn = document.getElementById('replace-instances');

		if (findBtn) {
			findBtn.setAttribute('aria-label', 'Find all instances of the URL in the first field');
		}

		if (replaceBtn) {
			replaceBtn.setAttribute('aria-label', 'Replace all instances of the URL with the new URL');
		}

		// Add live region for announcements
		const liveRegion = document.createElement('div');
		liveRegion.setAttribute('aria-live', 'polite');
		liveRegion.setAttribute('aria-atomic', 'true');
		liveRegion.className = 'sr-only';
		liveRegion.id = 'content-studio-live-region';
		document.body.appendChild(liveRegion);
	}

	/**
	 * Announce message to screen readers
	 * @param {string} message - Message to announce
	 */
	announceToScreenReader(message) {
		const liveRegion = document.getElementById('content-studio-live-region');
		if (liveRegion) {
			liveRegion.textContent = message;
			// Clear after announcement
			setTimeout(() => {
				liveRegion.textContent = '';
			}, 1000);
		}
	}

	/**
	 * Get module instance
	 * @param {string} moduleName - Name of the module
	 * @returns {Object|null} Module instance
	 */
	getModule(moduleName) {
		switch (moduleName) {
			case 'import':
				return this.importManager;
			case 'singleReplacement':
				return this.singleReplacementManager;
			case 'locationPreview':
				return this.locationPreviewManager;
			default:
				return null;
		}
	}

	/**
	 * Destroy all modules and clean up
	 */
	destroy() {
		// Clean up any event listeners or resources
		if (this.importManager) {
			// Add cleanup logic if needed
		}

		if (this.singleReplacementManager) {
			// Add cleanup logic if needed
		}

		if (this.locationPreviewManager) {
			// Add cleanup logic if needed
		}

		// Remove global references
		delete window.importManager;
		delete window.singleReplacementManager;
		delete window.locationPreviewManager;
	}
}

// Initialize the admin interface
const contentStudioAdmin = new ContentStudioAdmin();

// Make it globally available
window.contentStudioAdmin = contentStudioAdmin;

export default ContentStudioAdmin;
