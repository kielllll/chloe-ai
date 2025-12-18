import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamodbService implements OnModuleInit {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION') || 'ap-southeast-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName =
      this.configService.get<string>('DYNAMODB_TABLE_NAME') ||
      'chloe-ai-conversations';
  }

  async put(item: Record<string, any>) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await this.docClient.send(command);
  }

  async get(key: Record<string, any>) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: key,
    });

    const response = await this.docClient.send(command);
    return response.Item;
  }

  async update(
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames: Record<string, any>,
  ) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    });

    const response = await this.docClient.send(command);
    return response.Attributes;
  }

  async delete(key: Record<string, any>) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
    });

    return await this.docClient.send(command);
  }

  async query(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
  ) {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });

    const response = await this.docClient.send(command);
    return response.Items;
  }

  async scan() {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await this.docClient.send(command);
    return response.Items;
  }
}
