<?php
/**
 * Plugin Name: Content Studio
 * Description: Provides and interface to manage content across the site.
 * Author: Troy Chaplin
 * Version: 1.0.0
 * Text Domain: content-studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'CONTENT_STUDIO_VERSION', '1.0.0' );
define( 'CONTENT_STUDIO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CONTENT_STUDIO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Include required files
require_once CONTENT_STUDIO_PLUGIN_DIR . 'includes/class-link-manager.php';
require_once CONTENT_STUDIO_PLUGIN_DIR . 'includes/class-link-manager-admin.php';

// Initialize the plugin
function content_studio_init() {
	$content_studio = new Content_Studio();
	$content_studio->init();

	if ( is_admin() ) {
		$admin = new Content_Studio_Admin();
		$admin->init();
	}
}
add_action( 'init', 'content_studio_init' );

// Activation hook
register_activation_hook( __FILE__, 'content_studio_activate' );
function content_studio_activate() {
	// Create default options
	add_option(
		'content_studio_settings',
		array(
			'replacements' => array(),
		)
	);
}

// Deactivation hook
register_deactivation_hook( __FILE__, 'content_studio_deactivate' );
function content_studio_deactivate() {
	// Clean up if needed
}
