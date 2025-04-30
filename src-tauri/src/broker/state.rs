use std::sync::Arc;

use zeromq::Socket;

pub struct BrokerState {
    pub context: Arc<zeromq::RepSocket>,
}

// impl Default for BrokerState {
//     fn default() -> Self {
//         let mut socket = zeromq::RepSocket::new();
//         socket.bind("tcp://localhost:4267").await.unwrap();
//         Self {
//             context: Arc::new(socket),
//         }
//     }
// }
