import { MongoClient } from "mongodb";

const connect = async (): Promise<MongoClient> => {
  const client = await MongoClient.connect("mongodb://localhost:27017", {
    useUnifiedTopology: true,
  });

  return client;
};

export default connect;
