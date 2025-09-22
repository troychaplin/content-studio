# Content Studio - Modular JavaScript Architecture

This directory contains the modular JavaScript architecture for the Content Studio plugin, built with vanilla JavaScript and ES6 modules.

## Architecture Overview

The JavaScript code has been refactored from a monolithic jQuery-based approach to a modular vanilla JavaScript architecture with the following benefits:

- **No jQuery dependency** - Uses modern vanilla JavaScript
- **Modular structure** - Each feature is in its own module
- **ES6 modules** - Uses import/export for clean dependency management
- **Better maintainability** - Easier to test and modify individual features
- **Improved performance** - Smaller bundle size and better tree-shaking

## Module Structure

### Core Modules

#### `utils.js`
Utility functions used across all modules:
- `escapeHtml()` - HTML escaping for security
- `showNotification()` - User notification system
- `makeAjaxRequest()` - Promise-based AJAX wrapper
- `setButtonLoading()` - Button loading state management
- `getElement()` / `getElements()` - DOM query helpers
- `addEvent()` / `removeEvent()` - Event management
- `debounce()` / `throttle()` - Performance optimization helpers

#### `admin.js`
Main admin controller that:
- Initializes all modules
- Manages cross-module communication
- Provides global access to modules
- Handles keyboard shortcuts and accessibility features
- Manages form validation

### Feature Modules

#### `import.js` (ImportManager)
Handles file import functionality:
- File reading and parsing (CSV/JSON)
- Import preview with location filtering
- Batch import processing
- Dynamic button management
- Integration with single replacement workflow

#### `single-replacement.js` (SingleReplacementManager)
Manages single URL replacement:
- URL instance searching
- Replacement execution
- Results display with pagination
- Integration with import preview

#### `location-preview.js` (LocationPreviewManager)
Provides location preview functionality:
- Location data fetching and display
- Collapsible preview widgets
- Reusable preview components

## Usage

### Initialization
The main admin module automatically initializes when the page loads:

```javascript
// Automatically initialized
const contentStudioAdmin = new ContentStudioAdmin();
```

### Accessing Modules
Modules are available globally for cross-module communication:

```javascript
// Access import manager
const importManager = window.importManager;

// Access single replacement manager
const singleReplacementManager = window.singleReplacementManager;

// Access location preview manager
const locationPreviewManager = window.locationPreviewManager;
```

### Making AJAX Requests
Use the utility function for consistent AJAX handling:

```javascript
import { makeAjaxRequest } from './utils.js';

try {
    const data = await makeAjaxRequest('content_studio_find_instances', {
        search_url: 'https://example.com'
    });
    // Handle success
} catch (error) {
    // Handle error
}
```

### Event Handling
Use the utility functions for consistent event management:

```javascript
import { addEvent, getElement } from './utils.js';

const button = getElement('my-button');
addEvent(button, 'click', handleClick);
```

## Key Features

### Promise-based AJAX
All AJAX requests use modern Promise-based approach instead of jQuery callbacks:

```javascript
// Old jQuery approach
$.ajax({
    url: ajaxUrl,
    success: function(response) { /* handle success */ },
    error: function() { /* handle error */ }
});

// New Promise approach
try {
    const data = await makeAjaxRequest('action', { data: 'value' });
    // handle success
} catch (error) {
    // handle error
}
```

### Event Delegation
Uses modern event delegation for dynamic content:

```javascript
// Event delegation for dynamically created elements
document.addEventListener('click', this.handleDynamicEvents.bind(this));
```

### Accessibility Features
Built-in accessibility improvements:
- ARIA labels and live regions
- Keyboard shortcuts (Ctrl+Enter, Escape)
- Screen reader announcements
- Form validation feedback

### Performance Optimizations
- Debounced/throttled functions for performance
- Efficient DOM queries
- Minimal re-renders
- Tree-shakable modules

## Migration Notes

### From jQuery to Vanilla JS
The migration removed jQuery dependencies:

- `$(element)` → `getElement(id)` or `getElements(selector)`
- `$.ajax()` → `makeAjaxRequest()`
- `$(document).ready()` → `DOMContentLoaded` event
- `.on('click')` → `addEventListener('click')`
- `.val()` → `.value`
- `.html()` → `.innerHTML`
- `.show()/.hide()` → `.style.display`

### Module Communication
Modules communicate through:
- Global window references
- Direct method calls
- Event delegation
- Shared utility functions

## Development

### Adding New Features
1. Create a new module in `src/scripts/`
2. Import required utilities from `utils.js`
3. Export a class or functions
4. Import and initialize in `admin.js`
5. Add to global references if needed

### Testing
Each module can be tested independently:
- Unit tests for utility functions
- Integration tests for module interactions
- E2E tests for complete workflows

### Building
The build process uses webpack with WordPress scripts:
```bash
npm run build
```

This creates optimized bundles in the `build/` directory.
