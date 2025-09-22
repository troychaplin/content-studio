jQuery(document).ready(function($) {
    'use strict';



    // Preview import functionality
    $('#preview-import').on('click', function() {
        const fileInput = $('#import-file')[0];
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to preview.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
            
            previewImport(content, fileType, $(this));
        };
        reader.readAsText(file);
    });

    // Import functionality (after preview)
    $('#import-urls').on('click', function() {
        const fileInput = $('#import-file')[0];
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to import.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
            
            importReplacements(content, fileType, $(this));
        };
        reader.readAsText(file);
    });



    // Single replacement functionality
    $('#find-instances').on('click', function() {
        const searchUrl = $('#single-from-url').val();
        
        if (!searchUrl) {
            alert('Please enter a URL to search for.');
            return;
        }
        
        findUrlInstances(searchUrl, $(this));
    });

    $('#replace-instances').on('click', function() {
        const fromUrl = $('#single-from-url').val();
        const toUrl = $('#single-to-url').val();
        
        if (!fromUrl || !toUrl) {
            alert('Please enter both URLs.');
            return;
        }
        
        if (!confirm('Are you sure you want to replace all instances? This action cannot be undone.')) {
            return;
        }
        
        replaceUrlInstances(fromUrl, toUrl, $(this));
    });

    // Event delegation for dynamically created buttons
    $(document).on('click', '.edit-replacement-btn', function() {
        const index = parseInt($(this).data('index'));
        editReplacement(index);
    });

    $(document).on('click', '.preview-locations-btn', function() {
        const index = parseInt($(this).data('index'));
        const $button = $(this);
        const $previewRow = $('.preview-row[data-index="' + index + '"]');
        
        if ($previewRow.is(':visible')) {
            // Collapse
            $previewRow.hide();
            $button.text('Preview Locations');
        } else {
            // Expand and load preview
            $previewRow.show();
            $button.text('Hide Preview');
            loadLocationPreview(index);
        }
    });

    $(document).on('click', '.pagination-btn', function() {
        const page = parseInt($(this).data('page'));
        if (!window.searchResultsData || page < 1) return;
        
        window.searchResultsData.currentPage = page;
        
        // Update the results table
        const $results = $('#single-results');
        const currentHtml = $results.html();
        const newTableHtml = buildPaginatedResultsTable();
        
        // Replace the table part while keeping the summary
        const updatedHtml = currentHtml.replace(/<div class="search-results-table">[\s\S]*<\/div>/, newTableHtml);
        $results.html(updatedHtml);
    });



    /**
     * Escape HTML for display
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    /**
     * Preview import replacements from file
     */
    function previewImport(content, fileType, $button) {
        const $originalButton = $button;
        const originalText = $button.text();
        
        $button.addClass('testing').text('Previewing...');
        
        $.ajax({
            url: linkReplacement.ajaxUrl,
            type: 'POST',
            data: {
                action: 'link_replacement_preview_import',
                nonce: linkReplacement.nonce,
                file_content: content,
                file_type: fileType
            },
            success: function(response) {
                if (response.success) {
                    showImportPreview(response.data);
                } else {
                    showImportResult(response.data || 'Error previewing file', false);
                }
            },
            error: function() {
                showImportResult('Error previewing file', false);
            },
            complete: function() {
                $originalButton.removeClass('testing').text(originalText);
            }
        });
    }

    /**
     * Import replacements from file
     */
    function importReplacements(content, fileType, $button) {
        const $originalButton = $button;
        const originalText = $button.text();
        
        $button.addClass('testing').text(linkReplacement.strings.importing);
        
        $.ajax({
            url: linkReplacement.ajaxUrl,
            type: 'POST',
            data: {
                action: 'link_replacement_import_urls',
                nonce: linkReplacement.nonce,
                file_content: content,
                file_type: fileType
            },
            success: function(response) {
                if (response.success) {
                    showImportResult(response.data, true);
                    // Refresh the page to show new replacements
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                } else {
                    showImportResult(response.data || linkReplacement.strings.importError, false);
                }
            },
            error: function() {
                showImportResult(linkReplacement.strings.importError, false);
            },
            complete: function() {
                $originalButton.removeClass('testing').text(originalText);
            }
        });
    }


    /**
     * Show import preview
     */
    function showImportPreview(data) {
        const $preview = $('#import-preview');
        const $importButton = $('#import-urls');
        
        // Handle case where no URLs with instances were found
        if (data.count === 0) {
            let noResultsHtml = '<h4>No URLs with instances found</h4>';
            noResultsHtml += '<p>None of the URLs in your import file were found on this site.</p>';
            if (data.total_imported && data.total_imported > 0) {
                noResultsHtml += '<p><strong>Total URLs in file:</strong> ' + data.total_imported + '</p>';
                noResultsHtml += '<p><strong>URLs with zero instances:</strong> ' + data.filtered_out + '</p>';
            }
            noResultsHtml += '<p>You may want to check your URLs or try importing a different file.</p>';
            
            $preview.html(noResultsHtml).show();
            $importButton.hide();
            return;
        }
        
        let previewHtml = '<h4>Preview: ' + data.count + ' replacements found';
        if (data.total_imported && data.total_imported > data.count) {
            previewHtml += ' (filtered from ' + data.total_imported + ' total URLs)';
        }
        previewHtml += '</h4>';
        
        // Show filtering information if URLs were filtered out
        if (data.filtered_out && data.filtered_out > 0) {
            previewHtml += '<div class="inline notice notice-info"><p>';
            previewHtml += '<strong>Note:</strong> ' + data.filtered_out + ' URLs were filtered out because they have zero instances on this site. ';
            previewHtml += 'Only URLs that actually exist on your site are shown below.';
            previewHtml += '</p></div>';
        }
        
        previewHtml += '<div class="preview-table">';
        previewHtml += '<table class="fixed wp-list-table widefat striped">';
        previewHtml += '<thead><tr><th>Old URL</th><th>New URL</th><th>Actions</th></tr></thead>';
        previewHtml += '<tbody>';
        
        data.replacements.forEach(function(replacement, index) {
            previewHtml += '<tr class="replacement-row" data-index="' + index + '">';
            previewHtml += '<td><a href="' + escapeHtml(replacement.from_url) + '" target="_blank">' + escapeHtml(replacement.from_url) + '</a></td>';
            previewHtml += '<td><a href="' + escapeHtml(replacement.to_url) + '" target="_blank">' + escapeHtml(replacement.to_url) + '</a></td>';
            previewHtml += '<td class="actions-cell">';
            previewHtml += '<div class="action-buttons">';
            previewHtml += '<button type="button" class="button button-small button-secondary preview-locations-btn" data-index="' + index + '">Preview Locations</button>';
            previewHtml += '<button type="button" class="button button-small button-secondary edit-replacement-btn" data-index="' + index + '">Replace Single</button>';
            previewHtml += '</div>';
            previewHtml += '</td>';
            previewHtml += '</tr>';
            previewHtml += '<tr class="preview-row" data-index="' + index + '" style="display: none;">';
            previewHtml += '<td colspan="3" class="preview-content">';
            previewHtml += '<div class="preview-loading">Loading preview...</div>';
            previewHtml += '</td>';
            previewHtml += '</tr>';
        });
        
        previewHtml += '</tbody></table></div>';
        previewHtml += '<p><strong>Review the replacements above. Click "Replace Single" to load each replacement into the form above for individual processing.</strong></p>';
        
        $preview.html(previewHtml).show();
        $importButton.hide();
        
        // Store data for edit/view functions
        window.importPreviewData = data;
    }

    /**
     * Refresh the import preview to reflect current state
     */
    function refreshImportPreview() {
        if (!window.importPreviewData) return;
        
        // Filter out the replacement that was just completed
        const fromUrl = $('#single-from-url').val();
        const toUrl = $('#single-to-url').val();
        
        if (fromUrl && toUrl) {
            window.importPreviewData.replacements = window.importPreviewData.replacements.filter(function(replacement) {
                return !(replacement.from_url === fromUrl && replacement.to_url === toUrl);
            });
            
            // Update the count
            window.importPreviewData.count = window.importPreviewData.replacements.length;
            
            // Re-render the preview
            showImportPreview(window.importPreviewData);
        }
    }

    /**
     * Show import result
     */
    function showImportResult(message, success) {
        const $result = $('#import-result');
        $result.removeClass('success error').addClass(success ? 'success' : 'error');
        $result.html('<p>' + escapeHtml(message) + '</p>').show();
        
        if (success) {
            setTimeout(function() {
                $result.fadeOut();
            }, 5000);
        }
    }

    /**
     * Download file
     */
    function downloadFile(content, filename, mimeType) {
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
     * Find instances of a URL
     */
    function findUrlInstances(searchUrl, $button) {
        const $originalButton = $button;
        const originalText = $button.text();
        
        $button.addClass('testing').text('Searching...');
        
        $.ajax({
            url: linkReplacement.ajaxUrl,
            type: 'POST',
            data: {
                action: 'link_replacement_find_instances',
                nonce: linkReplacement.nonce,
                search_url: searchUrl
            },
            success: function(response) {
                if (response.success) {
                    showFindResults(response.data, searchUrl);
                } else {
                    showSingleResults('error', response.data || 'Error finding instances');
                }
            },
            error: function() {
                showSingleResults('error', 'Error finding instances');
            },
            complete: function() {
                $originalButton.removeClass('testing').text(originalText);
            }
        });
    }

    /**
     * Replace instances of a URL
     */
    function replaceUrlInstances(fromUrl, toUrl, $button) {
        const $originalButton = $button;
        const originalText = $button.text();
        
        $button.addClass('testing').text('Replacing...');
        
        $.ajax({
            url: linkReplacement.ajaxUrl,
            type: 'POST',
            data: {
                action: 'link_replacement_replace_instances',
                nonce: linkReplacement.nonce,
                from_url: fromUrl,
                to_url: toUrl
            },
            success: function(response) {
                if (response.success) {
                    showReplaceResults(response.data, fromUrl, toUrl);
                    
                    // If there's an import preview visible, refresh it to remove the completed replacement
                    if (window.importPreviewData && $('#import-preview').is(':visible')) {
                        refreshImportPreview();
                    }
                } else {
                    showSingleResults('error', response.data || 'Error replacing instances');
                }
            },
            error: function() {
                showSingleResults('error', 'Error replacing instances');
            },
            complete: function() {
                $originalButton.removeClass('testing').text(originalText);
            }
        });
    }

    /**
     * Show find results
     */
    function showFindResults(data, searchUrl) {
        let message = 'Found ' + data.total_found + ' instances of "' + escapeHtml(searchUrl) + '" in ' + data.locations.length + ' locations.';
        
        let additionalHtml = '';
        if (data.total_found > 0) {
            message += ' Click "Replace All Instances" to replace them.';
            $('#replace-instances').show();
            
            // Store data for pagination
            window.searchResultsData = {
                locations: data.locations,
                searchUrl: searchUrl,
                currentPage: 1,
                itemsPerPage: 25
            };
            
            // Add results table with pagination
            additionalHtml = buildPaginatedResultsTable();
        } else {
            message += ' No replacement needed.';
            $('#replace-instances').hide();
        }
        
        showSingleResults('info', message, data, additionalHtml);
    }

    /**
     * Build paginated results table
     */
    function buildPaginatedResultsTable() {
        if (!window.searchResultsData) return '';
        
        const { locations, currentPage, itemsPerPage } = window.searchResultsData;
        const totalPages = Math.ceil(locations.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, locations.length);
        const currentLocations = locations.slice(startIndex, endIndex);
        
        let html = '<div class="search-results-table">';
        html += '<h4>Locations where this URL appears:</h4>';
        
        // Pagination info
        html += '<div class="pagination-info">';
        html += 'Showing ' + (startIndex + 1) + ' to ' + endIndex + ' of ' + locations.length + ' locations';
        html += '</div>';
        
        // Results table
        html += '<div class="results-table">';
        html += '<table class="fixed wp-list-table widefat striped">';
        html += '<thead><tr><th>Title</th><th>Type</th><th>Count</th><th>Actions</th></tr></thead>';
        html += '<tbody>';
        
        currentLocations.forEach(function(location) {
            html += '<tr>';
            html += '<td><strong>' + escapeHtml(location.title) + '</strong></td>';
            html += '<td>' + escapeHtml(location.type) + '</td>';
            html += '<td>' + location.count + '</td>';
            html += '<td class="actions-cell">';
            html += '<div class="action-buttons">';
            html += '<a href="' + escapeHtml(location.url) + '" target="_blank" class="button button-small">View</a>';
            if (location.edit_url) {
                html += '<a href="' + escapeHtml(location.edit_url) + '" target="_blank" class="button button-small">Edit</a>';
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
                html += '<button type="button" class="button button-secondary pagination-btn" data-page="' + (currentPage - 1) + '">← Previous</button>';
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
                html += '<button type="button" class="button' + activeClass + ' pagination-btn" data-page="' + i + '">' + i + '</button>';
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += '<span class="pagination-ellipsis">...</span>';
                }
                html += '<button type="button" class="button button-secondary pagination-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
            }
            
            // Next button
            if (currentPage < totalPages) {
                html += '<button type="button" class="button button-secondary pagination-btn" data-page="' + (currentPage + 1) + '">Next →</button>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Show replace results
     */
    function showReplaceResults(data, fromUrl, toUrl) {
        let message = 'Successfully replaced "' + escapeHtml(fromUrl) + '" with "' + escapeHtml(toUrl) + '".';
        
        let detailsHtml = '<div class="single-results-details">';
        detailsHtml += '<div class="single-results-stat">';
        detailsHtml += '<span class="number">' + data.replaced_posts + '</span>';
        detailsHtml += '<span class="label">Posts & Pages</span>';
        detailsHtml += '</div>';
        detailsHtml += '<div class="single-results-stat">';
        detailsHtml += '<span class="number">' + data.replaced_meta + '</span>';
        detailsHtml += '<span class="label">Post Meta (ACF)</span>';
        detailsHtml += '</div>';
        detailsHtml += '</div>';
        
        showSingleResults('success', message, null, detailsHtml);
        $('#replace-instances').hide();
    }

    /**
     * Show single results
     */
    function showSingleResults(type, message, data, additionalHtml) {
        const $results = $('#single-results');
        
        let resultsHtml = '<div class="single-results-summary' + type + '">';
        resultsHtml += '<h4>' + (type === 'success' ? '✓ Success' : type === 'error' ? '✗ Error' : 'ℹ Info') + '</h4>';
        resultsHtml += '<p>' + message + '</p>';
        
        if (additionalHtml) {
            resultsHtml += additionalHtml;
        }
        
        resultsHtml += '</div>';
        
        $results.html(resultsHtml).show();
    }

    /**
     * Load location preview for a replacement
     */
    function loadLocationPreview(index) {
        if (!window.importPreviewData || !window.importPreviewData.replacements[index]) return;
        
        const replacement = window.importPreviewData.replacements[index];
        const $previewContent = $('.preview-row[data-index="' + index + '"] .preview-content');
        
        // Show loading state
        $previewContent.html('<div class="preview-loading">Searching for instances...</div>');
        
        $.ajax({
            url: linkReplacement.ajaxUrl,
            type: 'POST',
            data: {
                action: 'link_replacement_find_instances',
                nonce: linkReplacement.nonce,
                search_url: replacement.from_url
            },
            success: function(response) {
                if (response.success) {
                    displayLocationPreview(response.data, $previewContent);
                } else {
                    $previewContent.html('<div class="preview-error">Error: ' + escapeHtml(response.data || 'Unknown error') + '</div>');
                }
            },
            error: function() {
                $previewContent.html('<div class="preview-error">Error loading preview</div>');
            }
        });
    }

    /**
     * Display location preview
     */
    function displayLocationPreview(data, $container) {
        let previewHtml = '<div class="location-preview">';
        previewHtml += '<h5>Found ' + data.total_found + ' instances in ' + data.locations.length + ' locations:</h5>';
        
        if (data.locations.length > 0) {
            previewHtml += '<div class="location-list">';
            data.locations.forEach(function(location) {
                previewHtml += '<div class="location-item">';
                previewHtml += '<div class="location-header">';
                previewHtml += '<strong>' + escapeHtml(location.title) + '</strong>';
                previewHtml += '<span class="location-type">(' + escapeHtml(location.type) + ')</span>';
                previewHtml += '<span class="location-count">' + location.count + ' instance(s)</span>';
                previewHtml += '</div>';
                previewHtml += '<div class="location-actions">';
                previewHtml += '<a href="' + escapeHtml(location.url) + '" target="_blank" class="button button-small">View</a>';
                if (location.edit_url) {
                    previewHtml += '<a href="' + escapeHtml(location.edit_url) + '" target="_blank" class="button button-small">Edit</a>';
                }
                previewHtml += '</div>';
                previewHtml += '</div>';
            });
            previewHtml += '</div>';
        } else {
            previewHtml += '<p>No instances found.</p>';
        }
        
        previewHtml += '</div>';
        $container.html(previewHtml);
    }

    /**
     * Edit replacement
     */
    function editReplacement(index) {
        if (!window.importPreviewData || !window.importPreviewData.replacements[index]) return;
        
        const replacement = window.importPreviewData.replacements[index];
        
        // Fill the single replacement form with this data
        $('#single-from-url').val(replacement.from_url);
        $('#single-to-url').val(replacement.to_url);
        
        // Scroll to the single replacement section
        $('html, body').animate({
            scrollTop: $('.link-replacement-single-replacement').offset().top - 100
        }, 500);
        
        // Show a brief message
        const $results = $('#single-results');
        $results.html('<div class="single-results-summary info"><h4>ℹ Info</h4><p>Replacement loaded into Single URL Replacement form above.</p></div>').show();
    }

});
