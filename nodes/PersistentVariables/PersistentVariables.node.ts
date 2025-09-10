import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { SqliteService } from './SqliteService';

export class PersistentVariablesNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Persistent Variables',
		name: 'persistentVariables',
		icon: 'file:persistent-variables.svg',
		group: ['storage'],
		version: 1,
		description: 'Store and retrieve persistent variables using SQLite database',
		defaults: {
			name: 'Persistent Variables',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Set Variable',
						value: 'set',
						description: 'Store a variable with a name and value',
						action: 'Set a variable',
					},
					{
						name: 'Get Variable',
						value: 'get',
						description: 'Retrieve a variable by name',
						action: 'Get a variable',
					},
					{
						name: 'Get All Variables',
						value: 'getAll',
						description: 'Retrieve all stored variables',
						action: 'Get all variables',
					},
					{
						name: 'Delete Variable',
						value: 'delete',
						description: 'Delete a variable by name',
						action: 'Delete a variable',
					},
				],
				default: 'set',
			},
			{
				displayName: 'Variable Name',
				name: 'variableName',
				type: 'string',
				default: '',
				placeholder: 'myVariable',
				description: 'The name of the variable to store or retrieve',
				displayOptions: {
					show: {
						operation: ['set', 'get', 'delete'],
					},
				},
			},
			{
				displayName: 'Variable Type',
				name: 'variableType',
				type: 'options',
				options: [
					{
						name: 'String',
						value: 'string',
						description: 'Store as text string',
					},
					{
						name: 'Number',
						value: 'number',
						description: 'Store as numeric value',
					},
					{
						name: 'Boolean',
						value: 'boolean',
						description: 'Store as true/false value',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Store as JSON object/array',
					},
					{
						name: 'Date',
						value: 'date',
						description: 'Store as date value',
					},
				],
				default: 'string',
				description: 'The data type of the variable',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
			},
			{
				displayName: 'Variable Value',
				name: 'variableValue',
				type: 'string',
				default: '',
				placeholder: 'Enter the value to store',
				description: 'The value to store for the variable',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
			},
			{
				displayName: 'Database Path',
				name: 'dbPath',
				type: 'string',
				default: '',
				placeholder: '/path/to/database.db (optional)',
				description: 'Custom path for the SQLite database file. Leave empty to use default location.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const dbPath = this.getNodeParameter('dbPath', itemIndex, '') as string;

				// Initialize SQLite service
				const sqliteService = new SqliteService(dbPath || undefined);
				await sqliteService.initialize();

				let result: any = {};

				switch (operation) {
					case 'set': {
						const variableName = this.getNodeParameter('variableName', itemIndex) as string;
						const variableType = this.getNodeParameter('variableType', itemIndex) as string;
						const variableValue = this.getNodeParameter('variableValue', itemIndex) as string;

						if (!variableName) {
							throw new NodeOperationError(this.getNode(), 'Variable name is required');
						}

						// Parse value based on type
						let parsedValue: any = variableValue;
						try {
							switch (variableType) {
								case 'number':
									parsedValue = Number(variableValue);
									if (isNaN(parsedValue)) {
										throw new Error('Invalid number format');
									}
									break;
								case 'boolean':
									parsedValue = variableValue.toLowerCase() === 'true' || variableValue === '1';
									break;
								case 'json':
									parsedValue = JSON.parse(variableValue);
									break;
								case 'date':
									parsedValue = new Date(variableValue);
									if (isNaN(parsedValue.getTime())) {
										throw new Error('Invalid date format');
									}
									break;
								default:
									parsedValue = variableValue;
							}
						} catch (parseError) {
							throw new NodeOperationError(
								this.getNode(),
								`Failed to parse value as ${variableType}: ${parseError.message}`,
								{ itemIndex }
							);
						}

						await sqliteService.setVariable(variableName, parsedValue, variableType as any);
						result = {
							success: true,
							operation: 'set',
							variableName,
							variableType,
							message: `Variable '${variableName}' set successfully`,
						};
						break;
					}

					case 'get': {
						const variableName = this.getNodeParameter('variableName', itemIndex) as string;

						if (!variableName) {
							throw new NodeOperationError(this.getNode(), 'Variable name is required');
						}

						const variableData = await sqliteService.getVariable(variableName);
						if (variableData) {
							const deserializedValue = sqliteService.deserializeValue(variableData);
							result = {
								success: true,
								operation: 'get',
								variableName,
								variableType: variableData.type,
								value: deserializedValue,
								createdAt: variableData.createdAt,
								updatedAt: variableData.updatedAt,
							};
						} else {
							result = {
								success: false,
								operation: 'get',
								variableName,
								message: `Variable '${variableName}' not found`,
							};
						}
						break;
					}

					case 'getAll': {
						const allVariables = await sqliteService.getAllVariables();
						const variables: any = {};
						
						allVariables.forEach((varData) => {
							variables[varData.name] = {
								value: sqliteService.deserializeValue(varData),
								type: varData.type,
								createdAt: varData.createdAt,
								updatedAt: varData.updatedAt,
							};
						});

						result = {
							success: true,
							operation: 'getAll',
							variables,
							count: allVariables.length,
						};
						break;
					}

					case 'delete': {
						const variableName = this.getNodeParameter('variableName', itemIndex) as string;

						if (!variableName) {
							throw new NodeOperationError(this.getNode(), 'Variable name is required');
						}

						const deleted = await sqliteService.deleteVariable(variableName);
						result = {
							success: deleted,
							operation: 'delete',
							variableName,
							message: deleted 
								? `Variable '${variableName}' deleted successfully`
								: `Variable '${variableName}' not found`,
						};
						break;
					}

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				// Close database connection
				await sqliteService.close();

				// Add result to return data
				returnData.push({
					json: {
						...items[itemIndex].json,
						...result,
					},
					pairedItem: { item: itemIndex },
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[itemIndex].json,
							success: false,
							error: error.message,
						},
						pairedItem: { item: itemIndex },
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
