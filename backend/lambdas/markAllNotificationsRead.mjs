import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "social-media-notifications";

const allowedOrigins = [
  "http://localhost:5173",
  "https://cool-social-media-app.netlify.app"
];

const getCorsHeaders = (event) => {
  const origin = event?.headers?.origin || event?.headers?.Origin || "";
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "https://cool-social-media-app.netlify.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };
};

export const handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: getCorsHeaders(event), body: "" };
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Unauthorized" })
      };
    }

    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "attribute_not_exists(isRead) OR isRead = :false",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":false": false
      }
    }));

    const updatePromises = (result.Items || []).map(item =>
      dynamodb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId: item.userId, timestamp: item.timestamp },
        UpdateExpression: "SET isRead = :true",
        ExpressionAttributeValues: { ":true": true }
      }))
    );

    await Promise.all(updatePromises);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ success: true, updated: updatePromises.length })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
