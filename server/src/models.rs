use diesel::*;
use crate::schema::*;
use crate::schema::sql_types::TxsStatusType;

#[derive(Queryable, Insertable)]
// #[table_name="txs"] // FIXME
pub struct Tx {
    pub id: i64,
    pub user_id: i64,
    pub eth_account: Vec<u8>,
    pub usd_amount: i64,
    pub crypto_amount: i64,
    pub bid_date: i64,
    // pub status: TxsStatusType, // FIXME: Uncomment.
    pub tx_id: Vec<u8>, // FIXME: wrong length
}