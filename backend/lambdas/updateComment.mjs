import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

const getIdentity = (event) => {
  const claims = event?.requestContext?.authorizer?.claims || {};
  const userId = claims.sub || "";
  const username = claims["cognito:username"] || "";
  return { userId, username };
};

export const handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: getCorsHeaders(event), body: "" };
  }

  try {
    const { userId, username } = getIdentity(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Unauthorized" })
      };
    }

    const postId = event?.pathParameters?.postId;
    const commentId = event?.pathParameters?.commentId;
    const body = JSON.parse(event?.body || "{}");
    const createdAtRaw = body?.createdAt;
    const content = (body?.comment || body?.text || body?.content || "").trim();
    const createdAt = Number(createdAtRaw);

    if (!postId || !commentId || !Number.isFinite(createdAt) || !content) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "postId, commentId, createdAt, and non-empty comment are required" })
      };
    }

    const existingPost = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { postId, createdAt }
    }));

    if (!existingPost?.Item) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Post not found" })
      };
    }

    const comments = Array.isArray(existingPost.Item.comments) ? [...existingPost.Item.comments] : [];
    const index = comments.findIndex((item) => (item?.commentId || item?.id) === commentId);

    if (index === -1) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Comment not found" })
      };
    }

    const targetComment = comments[index] || {};
    const isOwner = targetComment?.userId === userId || (!!username && targetComment?.username === username);
    if (!isOwner) {
      return {
        statusCode: 403,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ message: "Not authorized to edit this comment" })
      };
    }

    const updatedComment = {
      ...targetComment,
      commentId: targetComment?.commentId || targetComment?.id || commentId,
      id: targetComment?.id || targetComment?.commentId || commentId,
      text: content,
      comment: content,
      content,
      updatedAt: new Date().toISOString()
    };

    comments[index] = updatedComment;

    await dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { postId, createdAt },
      UpdateExpression: "SET comments = :comments",
      ExpressionAttributeValues: {
        ":comments": comments
      }
    }));

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify(updatedComment)
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
