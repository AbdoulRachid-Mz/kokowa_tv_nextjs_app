// @/lib/utils/db-utils.ts
import { query } from "@/lib/db/connection";

export async function getNextAvailableOrder(
  table: string,
  column: string,
  whereColumn: string,
  whereValue: number,
  requestedOrder?: number
): Promise<number> {
  // Si un ordre est spécifié et disponible, on l'utilise
  if (requestedOrder !== undefined && requestedOrder !== null) {
    const existingCheck = await query<{ id: number }>(
      `SELECT id FROM ${table} WHERE ${column} = $1 AND ${whereColumn} = $2`,
      [requestedOrder, whereValue]
    );
    
    if (existingCheck.length === 0) {
      return requestedOrder;
    }
  }
  
  // Sinon, trouver le prochain ordre disponible
  const maxOrderResult = await query<{ max_order: number }>(
    `SELECT COALESCE(MAX(${column}), 0) as max_order 
     FROM ${table} WHERE ${whereColumn} = $1`,
    [whereValue]
  );
  
  return maxOrderResult[0]?.max_order + 1 || 1;
}

export async function getUniqueName(
  table: string,
  name: string,
  whereColumn: string,
  whereValue: number
): Promise<string> {
  let finalName = name;
  let counter = 1;
  
  const existingCheck = await query<{ id: number }>(
    `SELECT id FROM ${table} WHERE name = $1 AND ${whereColumn} = $2`,
    [finalName, whereValue]
  );
  
  while (existingCheck.length > 0) {
    finalName = `${name} (${counter})`;
    counter++;
    
    const newCheck = await query<{ id: number }>(
      `SELECT id FROM ${table} WHERE name = $1 AND ${whereColumn} = $2`,
      [finalName, whereValue]
    );
    
    if (newCheck.length === 0) {
      break;
    }
  }
  
  return finalName;
}