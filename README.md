# Content Studio Plugin

A modern WordPress plugin that provides a comprehensive content management interface for site administrators. Currently focused on URL replacement functionality, with plans to expand into a full-featured content management platform with multiple specialized interfaces.

**🚧 Currently in Development**: This plugin is undergoing a major React-based refactoring to create a modern, extensible architecture for multiple content management interfaces.

## Current Features (v0.0.1)

### URL Replacement Interface
- **URL Discovery**: Find all instances of a URL across your site before replacing
- **Location Review**: See exactly where URLs appear with direct links to edit pages
- **Bulk URL Management**: Import and manage multiple URL replacements from CSV or JSON files
- **Real-time Testing**: Test individual replacements with sample content
- **Pagination Support**: Handle large result sets with paginated views

### Coverage Areas
The plugin replaces URLs in:
- Post content and excerpts
- Widget text
- Comments
- Custom meta fields
- HTML attributes (href, src)
- Plain text URLs
- Site options

## Future Vision (v1.0.0+)

### Multi-Interface Architecture
Content Studio is being redesigned as a modular platform with specialized interfaces for different content management tasks:

- **URL Replacement Interface** (Current) - Replace URLs across your site
- **Text Replacement Interface** (Planned) - Replace text content and patterns
- **Image Replacement Interface** (Planned) - Replace images and media references
- **Content Migration Interface** (Planned) - Migrate content between formats
- **Custom Interfaces** (Planned) - Third-party extensible interfaces

### Modern React-Based Admin Interface
- **Component-Based UI**: Reusable, consistent interface components
- **Real-time Updates**: Live progress tracking and instant feedback
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance Optimized**: Fast loading and smooth interactions

## Installation

### Current Version (v0.0.1)
1. Upload the `content-studio` folder to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > Content Studio to configure your replacements

### Development Version (v1.0.0)
The React-based version is currently in development. To use the development version:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the React components
4. Activate the plugin in WordPress

**Note**: The development version requires Node.js and npm for building the React components.

## Usage

### Current Version (v0.0.1)

#### Single URL Replacement
1. Navigate to **Settings > Content Studio** in your WordPress admin
2. In the "Single URL Replacement" section:
   - Enter the URL you want to replace in the "URL to Replace" field
   - Enter the new URL in the "Replace With" field
3. Click **"Find All Instances"** to search for the URL across your site
4. Review the results showing where the URL appears
5. Click **"Replace All Instances"** to perform the replacement

### Future Version (v1.0.0)
The React-based interface will provide:
- **Tabbed Interface**: Switch between different content management tools
- **Real-time Updates**: Live progress tracking for all operations
- **Modern UI**: Intuitive, responsive interface with better UX
- **Extensible**: Easy to add new interfaces and features

### Bulk URL Management

#### Importing URL Replacements

1. Prepare your CSV or JSON file with URL replacements (see sample files below)
2. In the "Import URL Replacements" section, click **"Choose File"** and select your file
3. Click **"Preview Import"** to review the replacements before importing
4. Review the preview table showing all found replacements
5. Click **"Import Replacements"** to add them to your site

#### Preview and Individual Processing

- Use **"Preview Locations"** to see where each URL appears on your site
- Use **"Replace Single"** to load individual replacements into the single replacement form
- Each replacement can be processed individually for better control

### File Formats

#### CSV Format
```csv
old_url,new_url
https://old-site.com,https://new-site.com
https://old-site.com/page1,https://new-site.com/page1
https://old-site.com/images/,https://cdn.new-site.com/images/
```

#### JSON Format
```json
[
  {
    "old_url": "https://old-site.com",
    "new_url": "https://new-site.com"
  },
  {
    "old_url": "https://old-site.com/page1", 
    "new_url": "https://new-site.com/page1"
  }
]
```

**Note**: The plugin supports both `old_url`/`new_url` and `from_url`/`to_url` field names for maximum compatibility.

## How It Works

### Content Processing
The plugin uses WordPress filters to process content as it's displayed:

- `the_content` - Post content
- `the_excerpt` - Post excerpts  
- `widget_text` - Widget content
- `comment_text` - Comment content
- `get_post_metadata` - Custom meta fields

### URL Discovery
When you search for a URL, the plugin performs a comprehensive audit across:

- **Posts & Pages**: Content and excerpts
- **Custom Fields**: Post meta data
- **Comments**: Comment content
- **Site Options**: WordPress options table

### Replacement Process

For each replacement, the plugin:

1. **Escapes special regex characters** in the source URL
2. **Replaces URLs in HTML attributes** (`href` and `src`)
3. **Replaces plain text URLs** (not inside HTML tags)
4. **Preserves content structure** and formatting
5. **Updates database directly** for bulk replacements

## Configuration

### Custom Meta Fields

By default, the plugin processes these meta fields:
- `_wp_attachment_image_alt`
- `_wp_attachment_metadata`
- `custom_field_with_urls`

To add your own custom meta fields, edit the `$url_meta_keys` array in `includes/class-link-replacement.php`:

```php
$url_meta_keys = array(
    '_wp_attachment_image_alt',
    '_wp_attachment_metadata',
    'custom_field_with_urls',
    'your_custom_field_name', // Add your fields here
);
```

### Case Sensitivity

Replacements are case-insensitive by default. The plugin will match URLs regardless of case (e.g., `HTTPS://EXAMPLE.COM` will match `https://example.com`).

## Technical Details

### File Structure

```
link-replacement/
├── plugin.php                          # Main plugin file
├── includes/
│   ├── class-link-replacement.php      # Core functionality
│   └── class-link-replacement-admin.php # Admin interface
├── assets/
│   ├── admin.css                       # Admin styling
│   └── admin.js                        # Admin JavaScript
└── README.md                           # This file
```

### Database

The plugin stores its settings in the WordPress options table as `link_replacement_settings`:

```php
array(
    'replacements' => array(
        array(
            'from_url' => 'https://old-site.com',
            'to_url' => 'https://new-site.com',
            'description' => 'Main site migration',
            'case_sensitive' => false
        )
    )
)
```

### AJAX Endpoints

The plugin provides these AJAX endpoints:

- `link_replacement_find_instances` - Search for URL instances
- `link_replacement_replace_instances` - Replace URL instances
- `link_replacement_preview_import` - Preview import file
- `link_replacement_import_urls` - Import URL replacements
- `link_replacement_test_replacement` - Test replacement with sample content

### WordPress Hooks

- `init` - Initialize the plugin
- `admin_menu` - Add admin menu
- `admin_init` - Register settings
- `admin_enqueue_scripts` - Load admin assets
- `the_content` - Process post content
- `the_excerpt` - Process post excerpts
- `widget_text` - Process widget content
- `comment_text` - Process comment content
- `get_post_metadata` - Process custom meta fields

## Security

- **Input Sanitization**: All input is sanitized using WordPress functions (`esc_url_raw`, `sanitize_text_field`, etc.)
- **Nonce Protection**: AJAX requests are protected with WordPress nonces
- **URL Validation**: URLs are validated and escaped before processing
- **Permission Checks**: Only users with `manage_options` capability can access settings
- **SQL Injection Prevention**: All database queries use prepared statements

## Compatibility

- **WordPress**: 5.0+
- **PHP**: 7.4+
- **Browsers**: Modern browsers with JavaScript enabled
- **Multisite**: Compatible with WordPress Multisite installations

## Troubleshooting

### Replacements Not Working

1. **Check Plugin Status**: Ensure the plugin is activated
2. **Verify URL Match**: Check that your source URL exactly matches the URL in your content
3. **Clear Cache**: Clear any caching plugins or server-side cache
4. **Check Permissions**: Ensure you have `manage_options` capability
5. **Test with Single Replacement**: Use the single URL replacement feature to test individual URLs

### Performance Considerations

**Important**: This plugin processes content in real-time and performs database operations that may impact performance on large sites.

If you experience performance issues:

- **Large Sites**: For sites with thousands of posts, consider processing in smaller batches
- **Many Replacements**: Limit the number of active replacement rules
- **Caching**: Use caching plugins to reduce database load
- **Staging First**: Always test on a staging site before production
- **Monitor Resources**: Watch server CPU and memory usage during bulk operations
- **Database Load**: Bulk replacements perform direct database updates which may temporarily increase server load

### Common Issues

- **URL Encoding**: Ensure URLs are properly encoded (spaces, special characters)
- **Protocol Mismatch**: Check that HTTP vs HTTPS matches your content
- **Trailing Slashes**: Be consistent with trailing slashes in URLs
- **Case Sensitivity**: Remember replacements are case-insensitive by default

## Development & Contribution

### React Refactoring Plan

Content Studio is undergoing a major refactoring to create a modern, extensible architecture. The plan includes:

#### Phase 1: Foundation (Week 1)
- Set up React development environment
- Create core component architecture
- Build REST API endpoints
- Refactor PHP backend

#### Phase 2: React Development (Week 2-3)
- Convert existing functionality to React components
- Implement state management with hooks
- Add real-time features and WebSocket integration
- Build reusable UI component library

#### Phase 3: Advanced Features (Week 3-4)
- Add performance optimizations
- Implement comprehensive testing
- Add error handling and polish
- Complete migration and cleanup

### Contributing

We welcome contributions! Here's how to get involved:

#### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run start`
4. Build for production: `npm run build`

#### Development Guidelines
- **Code Style**: Follow WordPress coding standards for PHP, ESLint for JavaScript
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update documentation for any changes
- **Performance**: Consider performance implications of changes

#### Areas for Contribution
- **React Components**: Build reusable UI components
- **Interface Development**: Create new content management interfaces
- **API Development**: Extend REST API endpoints
- **Testing**: Improve test coverage and quality
- **Documentation**: Improve user and developer documentation
- **Performance**: Optimize loading times and user experience

#### Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Provide system information (WordPress version, PHP version, etc.)
- Check existing issues before creating new ones

#### Pull Requests
- Fork the repository and create a feature branch
- Make your changes with appropriate tests
- Update documentation as needed
- Submit a pull request with a clear description

### Architecture Overview

#### Frontend (React)
```
src/
├── components/         # Reusable UI components
├── interfaces/         # Interface-specific components
├── hooks/              # Custom React hooks
├── context/            # Global state management
└── utils/              # Helper functions
```

#### Backend (PHP)
```
includes/
├── api/                # REST API endpoints
├── interfaces/         # Interface implementations
├── core/               # Core functionality
└── admin/              # Admin interface
```

### Technology Stack
- **Frontend**: React 18, WordPress Components, Modern JavaScript
- **Backend**: PHP 8+, WordPress REST API, Modern PHP patterns
- **Build Tools**: Webpack, WordPress Scripts, npm
- **Testing**: Jest, React Testing Library, PHPUnit
- **Code Quality**: ESLint, PHPCS, Prettier

## Support

For issues or feature requests:
- Check the [UPGRADE.md](UPGRADE.md) for development plans
- Review the [DOCS.md](DOCS.md) for detailed documentation
- Open a GitHub issue for bugs or feature requests
- Contact the developer for questions

## Future Development

Content Studio is actively developed with a focus on:
- **Multi-Interface Architecture**: Expandable platform for different content management tasks
- **Modern User Experience**: React-based interface with real-time updates
- **Performance Optimization**: Fast, efficient content processing
- **Extensibility**: Plugin architecture for third-party interfaces
- **Community**: Open source development with community contributions

## Changelog

### Version 2.0.0 (In Development)
- **React-Based Refactoring**
- Modern React admin interface with component-based architecture
- REST API endpoints for all functionality
- Real-time updates and progress tracking
- Responsive design and accessibility improvements
- Extensible interface system for future content management tools
- Performance optimizations and modern development practices

### Version 1.0.0 (Current)
- **Initial Release**
- Single URL replacement with real-time search and preview
- Bulk URL import from CSV and JSON files
- Comprehensive URL discovery across posts, comments, meta fields, and options
- Location preview with direct links to edit pages
- Pagination support for large result sets
- Individual replacement processing from import preview
- Secure AJAX endpoints with nonce protection
- Support for content, widgets, comments, and meta fields
- Case-insensitive URL matching
- Sample CSV and JSON files included

## Roadmap

### Short Term (Next 4 Weeks)
- Complete React refactoring
- Modern admin interface
- REST API implementation
- Performance optimizations

### Medium Term (Next 3 Months)
- Text replacement interface
- Image replacement interface
- Plugin architecture for third-party interfaces
- Advanced content detection features

### Long Term (6+ Months)
- Content migration interface
- Marketplace for custom interfaces
- Community features and analytics
- Advanced reporting and monitoring
