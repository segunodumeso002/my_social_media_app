import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
    const content = (body?.content || "").trim();
    const image = typeof body?.image === "string" ? body.image : "";

    if (!userId) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Unauthorized" })
      };
    }

    if (!postId || createdAt === null || !content) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Missing required fields (postId, createdAt, content)" })
      };
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { postId, createdAt },
      UpdateExpression: "SET content = :content, image = :image, updatedAt = :updatedAt",
      ConditionExpression: "attribute_exists(postId) AND userId = :userId",
      ExpressionAttributeValues: {
        ":content": content,
        ":image": image,
        ":updatedAt": Date.now(),
        ":userId": userId
      },
      ReturnValues: "ALL_NEW"
    }));

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify(result.Attributes || { postId, createdAt, content, image })
    };
  } catch (error) {
    if (error?.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 403,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "You can only edit your own post" })
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