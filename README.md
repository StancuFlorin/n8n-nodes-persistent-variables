# n8n-nodes-persistent-variables

A custom n8n node for storing and retrieving persistent variables using SQLite database. This node allows you to maintain state across workflow executions and share data between different workflows.

## Features

- **Persistent Storage**: Variables are stored in a local SQLite database file
- **Multiple Data Types**: Support for string, number, boolean, JSON, and date types
- **CRUD Operations**: Set, get, delete, and list all variables
- **Type Safety**: Automatic type conversion and validation
- **Cross-Workflow Sharing**: Variables can be accessed from any workflow
- **Custom Database Path**: Option to specify custom database file location

## Installation

1. Install the package:
   ```bash
   npm install n8n-nodes-persistent-variables
   ```

2. The node will be automatically available in your n8n instance.

## Usage

### Operations

The Persistent Variables node supports four main operations:

#### 1. Set Variable
Store a variable with a specific name and value.

**Parameters:**
- **Variable Name**: The name of the variable to store
- **Variable Type**: The data type (string, number, boolean, json, date)
- **Variable Value**: The value to store
- **Database Path**: (Optional) Custom path for the SQLite database file

**Example:**
- Variable Name: `userCount`
- Variable Type: `number`
- Variable Value: `42`

#### 2. Get Variable
Retrieve a variable by its name.

**Parameters:**
- **Variable Name**: The name of the variable to retrieve
- **Database Path**: (Optional) Custom path for the SQLite database file

**Output:**
```json
{
  "success": true,
  "operation": "get",
  "variableName": "userCount",
  "variableType": "number",
  "value": 42,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### 3. Get All Variables
Retrieve all stored variables.

**Parameters:**
- **Database Path**: (Optional) Custom path for the SQLite database file

**Output:**
```json
{
  "success": true,
  "operation": "getAll",
  "variables": {
    "userCount": {
      "value": 42,
      "type": "number",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    },
    "lastUser": {
      "value": "john@example.com",
      "type": "string",
      "createdAt": "2024-01-01T12:05:00.000Z",
      "updatedAt": "2024-01-01T12:05:00.000Z"
    }
  },
  "count": 2
}
```

#### 4. Delete Variable
Remove a variable by its name.

**Parameters:**
- **Variable Name**: The name of the variable to delete
- **Database Path**: (Optional) Custom path for the SQLite database file

### Data Types

#### String
Store text values.
- **Example**: `"Hello World"`

#### Number
Store numeric values (integers and decimals).
- **Example**: `42`, `3.14`

#### Boolean
Store true/false values.
- **Example**: `true`, `false`

#### JSON
Store complex objects and arrays.
- **Example**: `{"name": "John", "age": 30}`, `[1, 2, 3]`

#### Date
Store date and time values.
- **Example**: `"2024-01-01T12:00:00.000Z"`

### Database Location

By default, the SQLite database is stored as `persistent_variables.db` in your n8n working directory. You can specify a custom path using the "Database Path" parameter.

### Use Cases

1. **Counter Variables**: Track counts across workflow executions
2. **User Sessions**: Store user data between workflow runs
3. **Configuration**: Store application settings
4. **State Management**: Maintain workflow state
5. **Data Caching**: Cache frequently accessed data
6. **Cross-Workflow Communication**: Share data between different workflows

### Example Workflows

#### Counter Workflow
1. Use "Get Variable" to retrieve current count
2. Increment the count
3. Use "Set Variable" to store the new count

#### User Session Management
1. Use "Set Variable" to store user login information
2. Use "Get Variable" in subsequent workflows to access user data
3. Use "Delete Variable" to clear session on logout

## Development

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/StancuFlorin/n8n-nodes-persistent-variables.git
   cd n8n-nodes-persistent-variables
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

### Testing

To test the node locally with n8n:

1. Build the project: `npm run build`
2. Link the package: `npm link`
3. In your n8n installation: `npm link n8n-nodes-persistent-variables`
4. Restart n8n

## License

[MIT](LICENSE.md)
