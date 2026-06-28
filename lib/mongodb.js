// Cliente de MongoDB con cache de conexión, apto para serverless (Vercel).
// La conexión se inicializa de forma perezosa (en la primera consulta), no al
// importar el módulo: así el build no intenta conectarse a Atlas.
// En desarrollo se cachea en `global` para sobrevivir a los hot-reloads.
import { MongoClient } from "mongodb";
import { DB_NAME } from "./collections.mjs";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
};

let clientPromise;

function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Falta la variable de entorno MONGODB_URI. Configurala en .env.local (local) y en Vercel (Project Settings → Environment Variables)."
    );
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options).connect();
  }
  return clientPromise;
}

export async function getClient() {
  return connect();
}

export async function getDb() {
  const client = await connect();
  return client.db(DB_NAME);
}

export default getClient;
