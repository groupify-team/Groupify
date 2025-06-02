import {
  RekognitionClient,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export async function compareFaces(sourceImageUrl, targetImageUrl) {
  try {
    const [sourceBuffer, targetBuffer] = await Promise.all([
      fetch(sourceImageUrl).then((res) => res.arrayBuffer()),
      fetch(targetImageUrl).then((res) => res.arrayBuffer()),
    ]);

    const input = {
      SourceImage: { Bytes: new Uint8Array(sourceBuffer) },
      TargetImage: { Bytes: new Uint8Array(targetBuffer) },
      SimilarityThreshold: 90,
    };

    const command = new CompareFacesCommand(input);
    const result = await client.send(command);

    return (
      result.FaceMatches &&
      result.FaceMatches.length > 0 &&
      result.FaceMatches[0].Similarity >= 90
    );
  } catch (error) {
    console.error("Face comparison failed:", error);
    return false;
  }
}
