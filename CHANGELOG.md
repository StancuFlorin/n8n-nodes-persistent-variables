# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Persistent Variables Node
- SQLite-based persistent storage
- Support for multiple data types (string, number, boolean, json, date)
- CRUD operations (set, get, delete, getAll)
- Cross-workflow variable sharing
- Custom database path configuration
- GitHub Actions for automated releases

### Features
- **Set Variable**: Store variables with name, value, and type
- **Get Variable**: Retrieve variables by name
- **Get All Variables**: List all stored variables
- **Delete Variable**: Remove variables by name
- **Type Safety**: Automatic type conversion and validation
- **Persistent Storage**: Variables survive workflow restarts
- **Error Handling**: Comprehensive error handling with detailed messages

## [1.0.3] - 2024-01-01

### Added
- Initial release
- Basic persistent variables functionality
- SQLite integration
- Multiple data type support
