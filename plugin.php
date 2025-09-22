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
define( 'LINK_REPLACEMENT_VERSION', '1.0.0' );
define( 'LINK_REPLACEMENT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LINK_REPLACEMENT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Include required files
require_once LINK_REPLACEMENT_PLUGIN_DIR . 'includes/class-link-manager.php';
require_once LINK_REPLACEMENT_PLUGIN_DIR . 'includes/class-link-manager-admin.php';

// Initialize the plugin
function link_replacement_init() {
	$link_replacement = new Link_Replacement();
	$link_replacement->init();

	if ( is_admin() ) {
		$admin = new Link_Replacement_Admin();
		$admin->init();
	}
}
add_action( 'init', 'link_replacement_init' );

// Activation hook
register_activation_hook( __FILE__, 'link_replacement_activate' );
function link_replacement_activate() {
	// Create default options
	add_option(
		'link_replacement_settings',
		array(
			'replacements' => array(),
		)
	);
}

// Deactivation hook
register_deactivation_hook( __FILE__, 'link_replacement_deactivate' );
function link_replacement_deactivate() {
	// Clean up if needed
}
