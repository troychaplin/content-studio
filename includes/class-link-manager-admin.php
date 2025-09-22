<?php
/**
 * Admin functionality for Link Replacement plugin
 *
 * @package Content_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Content_Studio_Admin
 */
class Content_Studio_Admin {

	/**
	 * Plugin settings
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Initialize admin functionality
	 */
	public function init() {
		$this->settings = get_option( 'content_studio_settings', array() );

		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'wp_ajax_content_studio_test_replacement', array( $this, 'ajax_test_replacement' ) );
		add_action( 'wp_ajax_content_studio_preview_import', array( $this, 'ajax_preview_import' ) );
		add_action( 'wp_ajax_content_studio_import_urls', array( $this, 'ajax_import_urls' ) );
		add_action( 'wp_ajax_content_studio_find_instances', array( $this, 'ajax_find_instances' ) );
		add_action( 'wp_ajax_content_studio_replace_instances', array( $this, 'ajax_replace_instances' ) );
	}

	/**
	 * Add admin menu
	 */
	public function add_admin_menu() {
		add_options_page(
			__( 'Content Studio', 'content-studio' ),
			__( 'Content Studio', 'content-studio' ),
			'manage_options',
			'content-studio',
			array( $this, 'admin_page' )
		);
	}

	/**
	 * Register settings
	 */
	public function register_settings() {
		register_setting(
			'content_studio_settings',
			'content_studio_settings',
			array( $this, 'sanitize_settings' )
		);
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_admin_scripts( $hook ) {
		if ( 'settings_page_content-studio' !== $hook ) {
			return;
		}

		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_enqueue_style(
			'content-studio-admin',
			CONTENT_STUDIO_PLUGIN_URL . 'build/admin.css',
			array(),
			CONTENT_STUDIO_VERSION
		);

		wp_enqueue_script(
			'content-studio-admin',
			CONTENT_STUDIO_PLUGIN_URL . 'build/admin.js',
			array( 'jquery', 'jquery-ui-sortable' ),
			CONTENT_STUDIO_VERSION,
			true
		);

		wp_localize_script(
			'content-studio-admin',
			'linkReplacement',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'content_studio_nonce' ),
				'strings' => array(
					'confirmDelete'   => __( 'Are you sure you want to delete this replacement?', 'content-studio' ),
					'testReplacement' => __( 'Test Replacement', 'content-studio' ),
					'testing'         => __( 'Testing...', 'content-studio' ),
					'error'           => __( 'Error occurred while testing.', 'content-studio' ),
					'importing'       => __( 'Importing...', 'content-studio' ),
					'exporting'       => __( 'Exporting...', 'content-studio' ),
					'confirmImport'   => __( 'This will add new replacements. Existing ones will not be overwritten. Continue?', 'content-studio' ),
					'importSuccess'   => __( 'Successfully imported {count} replacements', 'content-studio' ),
					'importError'     => __( 'Error importing replacements', 'content-studio' ),
				),
			)
		);
	}

	/**
	 * Sanitize settings
	 *
	 * @param array $input Raw input data.
	 * @return array Sanitized data.
	 */
	public function sanitize_settings( $input ) {
		$sanitized = array();

		// Sanitize replacements
		$sanitized['replacements'] = array();

		if ( ! empty( $input['replacements'] ) && is_array( $input['replacements'] ) ) {
			foreach ( $input['replacements'] as $index => $replacement ) {
				if ( empty( $replacement['from_url'] ) || empty( $replacement['to_url'] ) ) {
					continue;
				}

				$sanitized['replacements'][ $index ] = array(
					'from_url'       => esc_url_raw( $replacement['from_url'] ),
					'to_url'         => esc_url_raw( $replacement['to_url'] ),
					'description'    => sanitize_text_field( $replacement['description'] ?? '' ),
					'case_sensitive' => ! empty( $replacement['case_sensitive'] ),
				);
			}
		}

		return $sanitized;
	}

	/**
	 * Display admin page
	 */
	public function admin_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Link Replacement', 'content-studio' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Replace URLs throughout your WordPress site content, posts, pages, widgets, and comments.', 'content-studio' ); ?>
			</p>
				
			<div class="content-studio-single-replacement">
				<h2><?php esc_html_e( 'Single URL Replacement', 'content-studio' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Replace a single URL throughout your entire site.', 'content-studio' ); ?>
				</p>
				
				<div class="single-fields-row">
					<div class="single-field">
						<label for="single-from-url"><?php esc_html_e( 'URL to Replace:', 'content-studio' ); ?></label>
						<input type="url" id="single-from-url" class="regular-text" placeholder="https://old-site.com/page" />
					</div>
					<div class="single-field">
						<label for="single-to-url"><?php esc_html_e( 'Replace With:', 'content-studio' ); ?></label>
						<input type="url" id="single-to-url" class="regular-text" placeholder="https://new-site.com/page" />
					</div>
				</div>
				<div class="single-actions">
					<button type="button" id="find-instances" class="button button-secondary">
						<?php esc_html_e( 'Find All Instances', 'content-studio' ); ?>
					</button>
					<button type="button" id="replace-instances" class="button button-primary" style="display: none;">
						<?php esc_html_e( 'Replace All Instances', 'content-studio' ); ?>
					</button>
				</div>
				<div id="single-results" style="display: none;"></div>
			</div>

			<div class="content-studio-import">
				<h3><?php esc_html_e( 'Import URL Replacements', 'content-studio' ); ?></h3>
				<p class="description">
					<?php esc_html_e( 'Import URL replacements from CSV or JSON files to replace multiple URLs at once.', 'content-studio' ); ?>
				</p>
				
				<div class="import-field">
					<label for="import-file"><?php esc_html_e( 'Select File:', 'content-studio' ); ?></label>
					<input type="file" id="import-file" accept=".csv,.json" />
					<p class="description">
						<?php esc_html_e( 'Supported formats: CSV (old_url,new_url) or JSON with old_url/new_url fields', 'content-studio' ); ?>
					</p>
				</div>
				<button type="button" id="preview-import" class="button button-secondary">
					<?php esc_html_e( 'Preview Import', 'content-studio' ); ?>
				</button>
				<button type="button" id="import-urls" class="button button-primary" style="display: none;">
					<?php esc_html_e( 'Import Replacements', 'content-studio' ); ?>
				</button>
				<div id="import-preview" style="display: none;"></div>
				<div id="import-result" style="display: none;"></div>
				
				<div class="sample-files">
					<h5><?php esc_html_e( 'Sample Files:', 'content-studio' ); ?></h5>
					<p>
						<a href="<?php echo esc_url( CONTENT_STUDIO_PLUGIN_URL . 'samples/sample-urls.csv' ); ?>" download class="button button-small">
							<?php esc_html_e( 'Download Sample CSV', 'content-studio' ); ?>
						</a>
						<a href="<?php echo esc_url( CONTENT_STUDIO_PLUGIN_URL . 'samples/sample-urls.json' ); ?>" download class="button button-small">
							<?php esc_html_e( 'Download Sample JSON', 'content-studio' ); ?>
						</a>
					</p>
				</div>
			</div>

		</div>
		<?php
	}


	/**
	 * AJAX handler for testing replacement
	 */
	public function ajax_test_replacement() {
		check_ajax_referer( 'content_studio_nonce', 'nonce' );

		$from_url     = sanitize_url( wp_unslash( $_POST['from_url'] ?? '' ) );
		$to_url       = sanitize_url( wp_unslash( $_POST['to_url'] ?? '' ) );
		$test_content = sanitize_textarea_field( wp_unslash( $_POST['test_content'] ?? '' ) );

		if ( empty( $from_url ) || empty( $to_url ) || empty( $test_content ) ) {
			wp_send_json_error( __( 'All fields are required for testing.', 'content-studio' ) );
		}

		// Escape special regex characters
		$from_url_pattern = preg_quote( $from_url, '/' );

		// Test replacement
		$result = preg_replace(
			'/href=["\']' . $from_url_pattern . '["\']/i',
			'href="' . esc_attr( $to_url ) . '"',
			$test_content
		);

		$result = preg_replace(
			'/src=["\']' . $from_url_pattern . '["\']/i',
			'src="' . esc_attr( $to_url ) . '"',
			$result
		);

		$result = preg_replace(
			'/(?<!href=["\'])(?<!src=["\'])' . $from_url_pattern . '(?![^<]*>)/i',
			$to_url,
			$result
		);

		wp_send_json_success(
			array(
				'original' => $test_content,
				'replaced' => $result,
				'changed'  => $test_content !== $result,
			)
		);
	}

	/**
	 * AJAX handler for previewing import
	 */
	public function ajax_preview_import() {
		check_ajax_referer( 'content_studio_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Insufficient permissions.', 'content-studio' ) );
		}

		$file_content = wp_unslash( $_POST['file_content'] ?? '' );
		$file_type    = sanitize_text_field( wp_unslash( $_POST['file_type'] ?? 'csv' ) );

		if ( empty( $file_content ) ) {
			wp_send_json_error( __( 'No file content provided.', 'content-studio' ) );
		}

		$imported_urls = array();

		try {
			if ( 'csv' === $file_type ) {
				$imported_urls = $this->parse_csv_content( $file_content );
			} elseif ( 'json' === $file_type ) {
				$imported_urls = $this->parse_json_content( $file_content );
			} else {
				wp_send_json_error( __( 'Unsupported file format.', 'content-studio' ) );
			}

			if ( empty( $imported_urls ) ) {
				wp_send_json_error( __( 'No valid URL replacements found in the file.', 'content-studio' ) );
			}

			// Filter out URLs that have zero instances on the site
			$filtered_urls  = array();
			$total_imported = count( $imported_urls );
			$filtered_count = 0;

			foreach ( $imported_urls as $url_replacement ) {
				$search_url = $url_replacement['from_url'];

				// Check if this URL exists on the site
				$audit_results = $this->perform_url_audit( $search_url, array() );

				// Only include URLs that have at least one instance
				if ( $audit_results['total_found'] > 0 ) {
					$filtered_urls[] = $url_replacement;
					++$filtered_count;
				}
			}

			wp_send_json_success(
				array(
					'replacements'   => $filtered_urls,
					'count'          => $filtered_count,
					'total_imported' => $total_imported,
					'filtered_out'   => $total_imported - $filtered_count,
				)
			);

		} catch ( Exception $e ) {
			wp_send_json_error( __( 'Error parsing file: ', 'content-studio' ) . $e->getMessage() );
		}
	}

	/**
	 * AJAX handler for importing URLs
	 */
	public function ajax_import_urls() {
		check_ajax_referer( 'content_studio_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Insufficient permissions.', 'content-studio' ) );
		}

		$file_content = wp_unslash( $_POST['file_content'] ?? '' );
		$file_type    = sanitize_text_field( wp_unslash( $_POST['file_type'] ?? 'csv' ) );

		if ( empty( $file_content ) ) {
			wp_send_json_error( __( 'No file content provided.', 'content-studio' ) );
		}

		$imported_urls = array();

		try {
			if ( 'csv' === $file_type ) {
				$imported_urls = $this->parse_csv_content( $file_content );
			} elseif ( 'json' === $file_type ) {
				$imported_urls = $this->parse_json_content( $file_content );
			} else {
				wp_send_json_error( __( 'Unsupported file format.', 'content-studio' ) );
			}

			if ( empty( $imported_urls ) ) {
				wp_send_json_error( __( 'No valid URL replacements found in the file.', 'content-studio' ) );
			}

			// Filter out URLs that have zero instances on the site
			$filtered_urls  = array();
			$total_imported = count( $imported_urls );

			foreach ( $imported_urls as $url_replacement ) {
				$search_url = $url_replacement['from_url'];

				// Check if this URL exists on the site
				$audit_results = $this->perform_url_audit( $search_url, array() );

				// Only include URLs that have at least one instance
				if ( $audit_results['total_found'] > 0 ) {
					$filtered_urls[] = $url_replacement;
				}
			}

			if ( empty( $filtered_urls ) ) {
				wp_send_json_error( __( 'No URLs with instances found on this site. None of the URLs in your import file exist on the site.', 'content-studio' ) );
			}

			// Get current settings
			$current_settings = $this->settings;
			$existing_count   = count( $current_settings['replacements'] ?? array() );

			// Add filtered URLs to existing ones
			foreach ( $filtered_urls as $imported_url ) {
				$current_settings['replacements'][] = $imported_url;
			}

			// Update settings
			update_option( 'content_studio_settings', $current_settings );
			$this->settings = $current_settings;

			$imported_count = count( $filtered_urls );
			$filtered_out   = $total_imported - $imported_count;

			$message = sprintf(
				__( 'Successfully imported %1$d replacements. Total replacements: %2$d', 'content-studio' ),
				$imported_count,
				count( $current_settings['replacements'] )
			);

			if ( $filtered_out > 0 ) {
				$message .= sprintf(
					__( ' (%d URLs were filtered out because they have zero instances on this site)', 'content-studio' ),
					$filtered_out
				);
			}

			wp_send_json_success(
				array(
					'message'        => $message,
					'imported_count' => $imported_count,
					'total_count'    => count( $current_settings['replacements'] ),
				)
			);

		} catch ( Exception $e ) {
			wp_send_json_error( __( 'Error parsing file: ', 'content-studio' ) . $e->getMessage() );
		}
	}


	/**
	 * Parse CSV content
	 *
	 * @param string $content CSV content.
	 * @return array Array of URL replacements.
	 */
	private function parse_csv_content( $content ) {
		$lines        = str_getcsv( $content, "\n" );
		$replacements = array();

		// Skip header row if it exists
		$start_index = 0;
		if ( ! empty( $lines[0] ) && ( strpos( strtolower( $lines[0] ), 'old_url' ) !== false || strpos( strtolower( $lines[0] ), 'from_url' ) !== false ) ) {
			$start_index = 1;
		}

		for ( $i = $start_index; $i < count( $lines ); $i++ ) {
			$line = trim( $lines[ $i ] );
			if ( empty( $line ) ) {
				continue;
			}

			$columns = str_getcsv( $line );

			if ( count( $columns ) < 2 ) {
				continue;
			}

			$from_url = esc_url_raw( trim( $columns[0] ) );
			$to_url   = esc_url_raw( trim( $columns[1] ) );

			if ( empty( $from_url ) || empty( $to_url ) ) {
				continue;
			}

			$replacements[] = array(
				'from_url'       => $from_url,
				'to_url'         => $to_url,
				'description'    => '',
				'case_sensitive' => false,
			);
		}

		return $replacements;
	}

	/**
	 * Parse JSON content
	 *
	 * @param string $content JSON content.
	 * @return array Array of URL replacements.
	 */
	private function parse_json_content( $content ) {
		$data = json_decode( $content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			throw new Exception( 'Invalid JSON format: ' . json_last_error_msg() );
		}

		$replacements = array();

		// Handle both array of objects and object with replacements key
		if ( isset( $data['replacements'] ) ) {
			$data = $data['replacements'];
		}

		if ( ! is_array( $data ) ) {
			throw new Exception( 'JSON must contain an array of replacements' );
		}

		foreach ( $data as $item ) {
			// Support both old_url/new_url and from_url/to_url formats
			$from_url_field = isset( $item['old_url'] ) ? 'old_url' : ( isset( $item['from_url'] ) ? 'from_url' : null );
			$to_url_field   = isset( $item['new_url'] ) ? 'new_url' : ( isset( $item['to_url'] ) ? 'to_url' : null );

			if ( ! is_array( $item ) || ! $from_url_field || ! $to_url_field ) {
				continue;
			}

			$from_url = esc_url_raw( $item[ $from_url_field ] );
			$to_url   = esc_url_raw( $item[ $to_url_field ] );

			if ( empty( $from_url ) || empty( $to_url ) ) {
				continue;
			}

			$replacements[] = array(
				'from_url'       => $from_url,
				'to_url'         => $to_url,
				'description'    => '',
				'case_sensitive' => false,
			);
		}

		return $replacements;
	}



	/**
	 * Perform URL audit
	 *
	 * @param string $search_url URL to search for.
	 * @param array  $options    Search options (unused - kept for compatibility).
	 * @return array Audit results.
	 */
	private function perform_url_audit( $search_url, $options ) {
		$results = array(
			'total_found' => 0,
			'locations'   => array(),
		);

		// Search in posts and pages (content only, not revisions)
		$this->audit_posts( $search_url, $results );

		// Search in post meta (including ACF fields)
		$this->audit_custom_fields( $search_url, $results );

		return $results;
	}

	/**
	 * Audit posts and pages
	 *
	 * @param string $search_url URL to search for.
	 * @param array  $results    Results array (passed by reference).
	 */
	private function audit_posts( $search_url, &$results ) {
		global $wpdb;

		$post_types     = get_post_types( array( 'public' => true ), 'names' );
		$post_types_sql = "'" . implode( "','", array_map( 'esc_sql', $post_types ) ) . "'";

		$query = $wpdb->prepare(
			"SELECT ID, post_title, post_type, post_content 
			FROM {$wpdb->posts} 
			WHERE post_status = 'publish' 
			AND post_type IN ({$post_types_sql})
			AND post_type != 'revision'
			AND (post_content LIKE %s OR post_excerpt LIKE %s)",
			'%' . $wpdb->esc_like( $search_url ) . '%',
			'%' . $wpdb->esc_like( $search_url ) . '%'
		);

		$posts = $wpdb->get_results( $query );

		foreach ( $posts as $post ) {
			$count = substr_count( $post->post_content, $search_url ) + substr_count( $post->post_excerpt, $search_url );

			if ( $count > 0 ) {
				$results['locations'][]  = array(
					'type'      => 'post',
					'id'        => $post->ID,
					'title'     => $post->post_title,
					'post_type' => $post->post_type,
					'url'       => get_permalink( $post->ID ),
					'count'     => $count,
					'edit_url'  => get_edit_post_link( $post->ID ),
				);
				$results['total_found'] += $count;
			}
		}
	}

	/**
	 * Audit custom fields
	 *
	 * @param string $search_url URL to search for.
	 * @param array  $results    Results array (passed by reference).
	 */
	private function audit_custom_fields( $search_url, &$results ) {
		global $wpdb;

		$query = $wpdb->prepare(
			"SELECT pm.meta_key, pm.post_id, p.post_title, p.post_type 
			FROM {$wpdb->postmeta} pm
			INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
			WHERE pm.meta_value LIKE %s
			AND p.post_status = 'publish'",
			'%' . $wpdb->esc_like( $search_url ) . '%'
		);

		$meta_fields = $wpdb->get_results( $query );

		foreach ( $meta_fields as $field ) {
			$meta_value = get_post_meta( $field->post_id, $field->meta_key, true );
			$count      = substr_count( $meta_value, $search_url );

			if ( $count > 0 ) {
				$results['locations'][]  = array(
					'type'      => 'custom_field',
					'id'        => $field->post_id,
					'title'     => $field->post_title . ' (' . $field->meta_key . ')',
					'post_type' => $field->post_type,
					'url'       => get_permalink( $field->post_id ),
					'meta_key'  => $field->meta_key,
					'count'     => $count,
					'edit_url'  => get_edit_post_link( $field->post_id ),
				);
				$results['total_found'] += $count;
			}
		}
	}

	/**
	 * Audit comments
	 *
	 * @param string $search_url URL to search for.
	 * @param array  $results    Results array (passed by reference).
	 */
	private function audit_comments( $search_url, &$results ) {
		global $wpdb;

		$query = $wpdb->prepare(
			"SELECT c.comment_ID, c.comment_post_ID, c.comment_content, p.post_title, p.post_type
			FROM {$wpdb->comments} c
			INNER JOIN {$wpdb->posts} p ON c.comment_post_ID = p.ID
			WHERE c.comment_approved = '1'
			AND c.comment_content LIKE %s",
			'%' . $wpdb->esc_like( $search_url ) . '%'
		);

		$comments = $wpdb->get_results( $query );

		foreach ( $comments as $comment ) {
			$count = substr_count( $comment->comment_content, $search_url );

			if ( $count > 0 ) {
				$results['locations'][]  = array(
					'type'      => 'comment',
					'id'        => $comment->comment_ID,
					'title'     => 'Comment on: ' . $comment->post_title,
					'post_type' => $comment->post_type,
					'url'       => get_permalink( $comment->comment_post_ID ) . '#comment-' . $comment->comment_ID,
					'count'     => $count,
					'edit_url'  => admin_url( 'comment.php?action=editcomment&c=' . $comment->comment_ID ),
				);
				$results['total_found'] += $count;
			}
		}
	}

	/**
	 * Audit site options
	 *
	 * @param string $search_url URL to search for.
	 * @param array  $results    Results array (passed by reference).
	 */
	private function audit_options( $search_url, &$results ) {
		global $wpdb;

		$query = $wpdb->prepare(
			"SELECT option_name, option_value 
			FROM {$wpdb->options} 
			WHERE option_value LIKE %s
			AND option_name NOT LIKE %s",
			'%' . $wpdb->esc_like( $search_url ) . '%',
			'%content_studio%'
		);

		$options = $wpdb->get_results( $query );

		foreach ( $options as $option ) {
			$count = substr_count( $option->option_value, $search_url );

			if ( $count > 0 ) {
				$results['locations'][]  = array(
					'type'      => 'option',
					'id'        => $option->option_name,
					'title'     => 'Site Option: ' . $option->option_name,
					'post_type' => 'option',
					'url'       => admin_url( 'options-general.php' ),
					'count'     => $count,
					'edit_url'  => admin_url( 'options-general.php' ),
				);
				$results['total_found'] += $count;
			}
		}
	}

	/**
	 * AJAX handler for finding instances of a URL
	 */
	public function ajax_find_instances() {
		check_ajax_referer( 'content_studio_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Insufficient permissions.', 'content-studio' ) );
		}

		$search_url = sanitize_url( wp_unslash( $_POST['search_url'] ?? '' ) );

		if ( empty( $search_url ) ) {
			wp_send_json_error( __( 'Please provide a URL to search for.', 'content-studio' ) );
		}

		$results = $this->perform_url_audit(
			$search_url,
			array(
				'posts'         => true,
				'custom_fields' => true,
				'comments'      => true,
				'options'       => true,
			)
		);

		wp_send_json_success( $results );
	}

	/**
	 * AJAX handler for replacing instances of a URL
	 */
	public function ajax_replace_instances() {
		check_ajax_referer( 'content_studio_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Insufficient permissions.', 'content-studio' ) );
		}

		$from_url = sanitize_url( wp_unslash( $_POST['from_url'] ?? '' ) );
		$to_url   = sanitize_url( wp_unslash( $_POST['to_url'] ?? '' ) );

		if ( empty( $from_url ) || empty( $to_url ) ) {
			wp_send_json_error( __( 'Please provide both URLs.', 'content-studio' ) );
		}

		$results = $this->perform_url_replacement( $from_url, $to_url );

		// If replacement was successful, remove it from the settings
		if ( $results['total_replacements'] > 0 ) {
			$this->remove_replacement_from_settings( $from_url, $to_url );
		}

		wp_send_json_success( $results );
	}

	/**
	 * Perform URL replacement throughout the site
	 *
	 * @param string $from_url URL to replace.
	 * @param string $to_url   Replacement URL.
	 * @return array Results.
	 */
	private function perform_url_replacement( $from_url, $to_url ) {
		global $wpdb;

		$results = array(
			'replaced_posts'     => 0,
			'replaced_meta'      => 0,
			'total_replacements' => 0,
		);

		// Replace in posts content and excerpts (excluding revisions)
		$posts_updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->posts} 
				SET post_content = REPLACE(post_content, %s, %s),
				    post_excerpt = REPLACE(post_excerpt, %s, %s)
				WHERE (post_content LIKE %s OR post_excerpt LIKE %s)
				AND post_status = 'publish'
				AND post_type != 'revision'",
				$from_url,
				$to_url,
				$from_url,
				$to_url,
				'%' . $wpdb->esc_like( $from_url ) . '%',
				'%' . $wpdb->esc_like( $from_url ) . '%'
			)
		);

		// Replace in post meta (including ACF fields)
		$meta_updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->postmeta} 
				SET meta_value = REPLACE(meta_value, %s, %s)
				WHERE meta_value LIKE %s",
				$from_url,
				$to_url,
				'%' . $wpdb->esc_like( $from_url ) . '%'
			)
		);

		$results['replaced_posts']     = $posts_updated;
		$results['replaced_meta']      = $meta_updated;
		$results['total_replacements'] = $results['replaced_posts'] + $results['replaced_meta'];

		return $results;
	}

	/**
	 * Remove a replacement from the settings
	 *
	 * @param string $from_url URL to remove.
	 * @param string $to_url   Replacement URL to remove.
	 */
	private function remove_replacement_from_settings( $from_url, $to_url ) {
		$current_settings = $this->settings;

		if ( empty( $current_settings['replacements'] ) ) {
			return;
		}

		// Find and remove the matching replacement
		foreach ( $current_settings['replacements'] as $index => $replacement ) {
			if ( $replacement['from_url'] === $from_url && $replacement['to_url'] === $to_url ) {
				unset( $current_settings['replacements'][ $index ] );
				break;
			}
		}

		// Re-index the array to remove gaps
		$current_settings['replacements'] = array_values( $current_settings['replacements'] );

		// Update the settings
		update_option( 'content_studio_settings', $current_settings );
		$this->settings = $current_settings;
	}
}
