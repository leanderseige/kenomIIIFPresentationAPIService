exports.cache_table_definition = `CREATE TABLE IF NOT EXISTS cache (
  identifier TEXT PRIMARY KEY,
  last INTEGER,
  body BLOB
)`

exports.cache_get_query = `SELECT body, last FROM cache WHERE identifier = ? `

exports.cache_store_query = `REPLACE INTO cache(
  identifier,
  last,
  body
)
VALUES(?,?,?)
`
