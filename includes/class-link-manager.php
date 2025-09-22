<?php
/**
 * Main Content Studio class
 *
 * @package Content_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Content_Studio
 */
class Content_Studio {

	/**
	 * Plugin settings
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Initialize the plugin
	 */
	public function init() {
		$this->settings = get_option( 'content_studio_settings', array() );
		$this->add_hooks();
	}

	/**
	 * Add WordPress hooks
	 */
	private function add_hooks() {
		// Filter content on display
		add_filter( 'the_content', array( $this, 'replace_urls_in_content' ), 20 );
		add_filter( 'the_excerpt', array( $this, 'replace_urls_in_content' ), 20 );

		// Filter widgets
		add_filter( 'widget_text', array( $this, 'replace_urls_in_content' ), 20 );

		// Filter comments
		add_filter( 'comment_text', array( $this, 'replace_urls_in_content' ), 20 );

		// Filter post meta
		add_filter( 'get_post_metadata', array( $this, 'replace_urls_in_meta' ), 20, 4 );
	}

	/**
	 * Replace URLs in content
	 *
	 * @param string $content The content to process.
	 * @return string Modified content.
	 */
	public function replace_urls_in_content( $content ) {
		if ( empty( $content ) || empty( $this->settings['replacements'] ) ) {
			return $content;
		}

		$replacements = $this->settings['replacements'];

		// Process each replacement
		foreach ( $replacements as $replacement ) {
			if ( empty( $replacement['from_url'] ) || empty( $replacement['to_url'] ) ) {
				continue;
			}

			$from_url = $replacement['from_url'];
			$to_url   = $replacement['to_url'];

			// Escape special regex characters in the from_url
			$from_url_pattern = preg_quote( $from_url, '/' );

			// Replace in href attributes
			$content = preg_replace(
				'/href=["\']' . $from_url_pattern . '["\']/i',
				'href="' . esc_attr( $to_url ) . '"',
				$content
			);

			// Replace in src attributes
			$content = preg_replace(
				'/src=["\']' . $from_url_pattern . '["\']/i',
				'src="' . esc_attr( $to_url ) . '"',
				$content
			);

			// Replace plain URLs in text (not in HTML attributes)
			$content = preg_replace(
				'/(?<!href=["\'])(?<!src=["\'])' . $from_url_pattern . '(?![^<]*>)/i',
				$to_url,
				$content
			);
		}

		return $content;
	}

	/**
	 * Replace URLs in post meta
	 *
	 * @param mixed  $value    The meta value.
	 * @param int    $post_id  The post ID.
	 * @param string $meta_key The meta key.
	 * @param bool   $single   Whether to return a single value.
	 * @return mixed Modified meta value.
	 */
	public function replace_urls_in_meta( $value, $post_id, $meta_key, $single ) {
		// Only process specific meta keys that might contain URLs.
		$url_meta_keys = array(
			'_wp_attachment_image_alt',
			'_wp_attachment_metadata',
			'custom_field_with_urls',
		);

		if ( ! in_array( $meta_key, $url_meta_keys, true ) ) {
			return $value;
		}

		if ( is_string( $value ) ) {
			return $this->replace_urls_in_content( $value );
		}

		return $value;
	}

	/**
	 * Get plugin settings
	 *
	 * @return array
	 */
	public function get_settings() {
		return $this->settings;
	}

	/**
	 * Update plugin settings
	 *
	 * @param array $settings New settings.
	 */
	public function update_settings( $settings ) {
		$this->settings = $settings;
		update_option( 'content_studio_settings', $settings );
	}
}
