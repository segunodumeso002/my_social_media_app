import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "social-media-posts";

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

const parseBody = (event) => {
  if (!event?.body) return {};
  if (typeof event.body === "string") {
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  }
  return event.body;
};

const toNumberTimestamp = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: getCorsHeaders(event), body: "" };
  }

  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const postId = event.pathParameters?.postId;
    const body = parseBody(event);

    const createdAt = toNumberTimestamp(body?.createdAt);

    if (!userId) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Unauthorized" })
      };
    }

    if (!postId || createdAt === null) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Missing required fields (postId, createdAt)" })
      };
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { postId, createdAt },
      ConditionExpression: "attribute_exists(postId) AND userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    }));

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ success: true, postId, createdAt })
    };
  } catch (error) {
    if (error?.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 403,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "You can only delete your own post" })
      };
    }

    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};