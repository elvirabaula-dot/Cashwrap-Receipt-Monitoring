import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

// ... existing connection setup ...

const client = new MongoClient(uri, options);
attachDatabasePool(client);
