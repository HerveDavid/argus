use std::sync::Arc;
use zeromq::{PubSocket, Socket, SocketRecv, SocketSend, SubSocket};

use super::error::Result;

pub struct BrokerState {
    pub_socket: PubSocket,
    sub_socket: SubSocket,
    pub_port: u16,
    sub_port: u16,
}

impl BrokerState {
    pub async fn new() -> Result<Arc<tokio::sync::Mutex<Self>>> {
        let broker = Self::new_dynamic(Some(10241), Some(10242)).await?;
        let broker_arc = Arc::new(tokio::sync::Mutex::new(broker));

        // Start proxy
        let proxy_broker = Arc::clone(&broker_arc);
        tokio::spawn(async move {
            let mut broker = proxy_broker.lock().await;
            if let Err(e) = broker.start_proxy().await {
                log::error!("Broker proxy error: {}", e);
            }
        });

        Ok(broker_arc)
    }

    pub async fn new_dynamic(pub_port: Option<u16>, sub_port: Option<u16>) -> Result<Self> {
        let pub_port = pub_port.unwrap_or(10241);
        let sub_port = sub_port.unwrap_or(10242);

        println!(
            "Setting up ZMQ broker on ports {} (PUB) and {} (SUB)",
            pub_port, sub_port
        );

        let mut pub_socket = PubSocket::new();
        pub_socket
            .bind(&format!("tcp://127.0.0.1:{}", pub_port))
            .await?;

        let mut sub_socket = SubSocket::new();
        sub_socket
            .bind(&format!("tcp://127.0.0.1:{}", sub_port))
            .await?;

        sub_socket.subscribe("").await?;

        println!("ZMQ broker started successfully");
        println!("\t- PUB (for subscribers): tcp://localhost:{}", pub_port);
        println!("\t- SUB (for publishers): tcp://localhost:{}", sub_port);
        Ok(Self {
            pub_socket,
            sub_socket,
            pub_port,
            sub_port,
        })
    }

    pub async fn start_proxy(&mut self) -> Result<()> {
        loop {
            match self.sub_socket.recv().await {
                Ok(message) => {
                    if let Some(msg_bytes) = message.get(0) {
                        if let Ok(_msg_str) = std::str::from_utf8(msg_bytes) {
                            log::debug!("Broker received a message");
                        }
                    }

                    if let Err(e) = self.pub_socket.send(message).await {
                        log::error!("Error forwarding message: {}", e);
                    } else {
                        log::debug!("Message forwarded to subscribers");
                    }
                }
                Err(e) => {
                    log::error!("Error receiving message: {}", e);
                }
            }
        }
    }

    pub fn get_ports(&self) -> (u16, u16) {
        (self.pub_port, self.sub_port)
    }
}
