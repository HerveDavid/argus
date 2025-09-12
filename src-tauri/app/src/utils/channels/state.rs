use tokio::sync::Mutex;

use crate::utils::tasks::CancellableTask;
use std::{
    collections::HashMap,
    sync::{atomic::AtomicBool, Arc},
};

#[derive(Default)]
pub struct ChannelsInner {
    pub channels: HashMap<String, (Arc<AtomicBool>, CancellableTask<()>)>,
}

pub type Channels = Mutex<ChannelsInner>;
